import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// 1. Carregar credenciais do ambiente / .env
let apiKey = process.env.N8N_API_KEY;
let n8nHost = process.env.N8N_HOST;
let webhookUrl = process.env.EVOLUTION_WEBHOOK_URL;

const envFiles = ['.env', '.env.staging', '.env.local'];
for (const envFile of envFiles) {
  const p = path.join(ROOT, envFile);
  if (fs.existsSync(p)) {
    const lines = fs.readFileSync(p, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!apiKey && (trimmed.startsWith('N8N_API_KEY=') || trimmed.startsWith('STAGING_N8N_API_KEY='))) {
        apiKey = trimmed.split('=').slice(1).join('=').trim();
      }
      if (!n8nHost && (trimmed.startsWith('N8N_HOST=') || trimmed.startsWith('STAGING_N8N_HOST='))) {
        n8nHost = trimmed.split('=').slice(1).join('=').trim();
      }
      if (!webhookUrl && (trimmed.startsWith('STAGING_N8N_WEBHOOK_URL=') || trimmed.startsWith('EVOLUTION_WEBHOOK_URL='))) {
        webhookUrl = trimmed.split('=').slice(1).join('=').trim();
      }
    }
  }
}

// Parse CLI arguments
const args = process.argv.slice(2);
const isExecute = args.includes('--execute') || args.includes('--apply');
const isForceAll = args.includes('--all');
const isProd = args.includes('--prod') || args.includes('--production');

function getArgValue(flag) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1].trim();
  const eq = args.find(a => a.startsWith(`${flag}=`));
  if (eq) return eq.split('=').slice(1).join('=').trim();
  return null;
}

const customHost = getArgValue('--host');
const customApiKey = getArgValue('--api-key') || getArgValue('--key');
const customWebhookUrl = getArgValue('--webhook-url') || getArgValue('--webhook');

// Se foi pedido --prod, aponta para os endpoints de produção
if (isProd) {
  n8nHost = customHost || 'apiadswhats.alvoestrategia.com.br';
  webhookUrl = customWebhookUrl || 'https://apiadswhats.alvoestrategia.com.br/app/adswhatsinbound';
  if (customApiKey) apiKey = customApiKey;
} else {
  if (customHost) n8nHost = customHost;
  if (customApiKey) apiKey = customApiKey;
  if (customWebhookUrl) webhookUrl = customWebhookUrl;
}

if (!n8nHost || !apiKey) {
  console.error('\n❌ N8N_HOST ou N8N_API_KEY não encontrados!');
  console.error('Use: bun run scripts/replay_inbound_executions.js [--prod] [--api-key <chave>] [--execute]\n');
  process.exit(1);
}

n8nHost = n8nHost.replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim();
const API_BASE_URL = `https://${n8nHost}/api/v1`;

if (!webhookUrl) {
  webhookUrl = `https://${n8nHost}/app/adswhatsinbound`;
}

// Início do dia de hoje (meia-noite no fuso local Brasilia UTC-3)
const now = new Date();
const todayBrasilia = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
// Converte para UTC para filtrar na API
const startedAfter = new Date(todayBrasilia.getTime() - (todayBrasilia.getTimezoneOffset() * 60000)).toISOString();

console.log(`\n🔄 AdsWhats Monitor — Reprocessador de Execuções Inbound`);
console.log(`══════════════════════════════════════════════════════════════════════`);
console.log(`🌐 n8n Host:    https://${n8nHost}`);
console.log(`📡 Webhook URL: ${webhookUrl}`);
console.log(`📅 Filtrando execuções desde: ${todayBrasilia.toLocaleDateString('pt-BR')} 00:00:00 (ISO: ${startedAfter})`);
console.log(`⚙️  Modo:         ${isExecute ? '🚀 EXECUÇÃO REAL (Reenviando payloads)' : '👀 DRY-RUN (Apenas análise e listagem)'}`);
console.log(`══════════════════════════════════════════════════════════════════════\n`);

async function n8nRequest(endpoint) {
  const url = `${API_BASE_URL}${endpoint}`;
  const resp = await fetch(url, {
    headers: {
      'X-N8N-API-KEY': apiKey,
      'Accept': 'application/json'
    }
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`n8n API ${resp.status} ${resp.statusText} em ${endpoint}: ${txt}`);
  }

  return await resp.json();
}

async function main() {
  // 1. Localizar o workflow "ADSWHATHS - INBOUND"
  console.log('📡 Buscando workflow "ADSWHATHS - INBOUND"...');
  const workflowsResp = await n8nRequest('/workflows?limit=100');
  const workflows = workflowsResp.data || workflowsResp || [];
  const targetWorkflow = workflows.find(w => w.name && w.name.trim() === 'ADSWHATHS - INBOUND');

  if (!targetWorkflow) {
    console.error('❌ Workflow "ADSWHATHS - INBOUND" não encontrado na instância!');
    process.exit(1);
  }

  const workflowId = targetWorkflow.id;
  console.log(`✅ Workflow identificado: "${targetWorkflow.name}" (ID: ${workflowId})\n`);

  // 2. Buscar execuções de hoje
  console.log(`📡 Buscando histórico de execuções de hoje...`);
  let allExecutions = [];
  let cursor = null;
  let page = 1;

  while (true) {
    let endpoint = `/executions?workflowId=${workflowId}&limit=100`;
    if (cursor) endpoint += `&cursor=${encodeURIComponent(cursor)}`;

    const pageResp = await n8nRequest(endpoint);
    const list = pageResp.data || [];
    allExecutions.push(...list);

    cursor = pageResp.nextCursor;
    if (!cursor || list.length === 0) break;

    // Se as execuções da página já são anteriores a hoje, encerra busca
    const oldestInBatch = new Date(list[list.length - 1].startedAt);
    if (oldestInBatch < todayBrasilia) break;

    page++;
    if (page > 20) break; // Trava de segurança para no máximo 2000 execuções
  }

  // Filtra as de hoje
  const todayExecutions = allExecutions.filter(e => {
    const d = new Date(e.startedAt);
    return d >= todayBrasilia;
  });

  console.log(`📊 Total de execuções encontradas hoje: ${todayExecutions.length}\n`);

  if (todayExecutions.length === 0) {
    console.log('✨ Nenhuma execução registrada para hoje neste workflow.');
    return;
  }

  // 3. Analisar cada execução detalhada
  console.log('🔍 Analisando detalhes das execuções (identificando payloads bloqueados)...');
  const blockedExecutions = [];

  for (let i = 0; i < todayExecutions.length; i++) {
    const execSummary = todayExecutions[i];
    process.stdout.write(`\r   Verificando execução [${i + 1}/${todayExecutions.length}] (ID: ${execSummary.id})...`);

    try {
      const detail = await n8nRequest(`/executions/${execSummary.id}?includeData=true`);
      const runData = detail.data?.resultData?.runData || {};

      // Verifica se passou pelo nó de webhook
      const webhookRun = runData['Webhook Evolution'] || runData['Initial'];
      if (!webhookRun || !webhookRun[0]) continue;

      const incomingData = webhookRun[0].data?.main?.[0]?.[0]?.json || {};
      const payloadBody = incomingData.body || incomingData;

      // Verifica se foi bloqueada
      const reachedUnauthorized = Boolean(runData['Responder Webhook Nao Autorizado']);
      const reachedLojaNotFound = runData['Loja Encontrada?'] && !runData['Loja Encontrada?'][0]?.data?.main?.[0]?.length;
      const reachedGravarMensagem = Boolean(runData['Gravar Mensagem'] && runData['Gravar Mensagem'][0]?.data?.main?.[0]?.length);

      const isBlocked = reachedUnauthorized || reachedLojaNotFound || !reachedGravarMensagem;

      if (isBlocked || isForceAll) {
        const key = payloadBody.data?.key || payloadBody.key || {};
        const remoteJid = key.remoteJid || payloadBody.sender || '';
        const fromMe = Boolean(key.fromMe);
        const pushName = payloadBody.data?.pushName || payloadBody.pushName || '';
        const msgText = payloadBody.data?.message?.conversation || payloadBody.data?.message?.extendedTextMessage?.text || '[Mídia/Outro]';

        blockedExecutions.push({
          execId: execSummary.id,
          startedAt: execSummary.startedAt,
          instance: payloadBody.instance || '',
          sender: payloadBody.sender || '',
          remoteJid,
          fromMe,
          pushName,
          msgSnippet: msgText.length > 50 ? msgText.substring(0, 47) + '...' : msgText,
          payload: payloadBody,
          rawHeaders: incomingData.headers || {}
        });
      }
    } catch (err) {
      // Ignora erro de fetch pontual
    }
  }

  console.log(`\n\n📌 Total de execuções com mensagens NÃO gravadas: ${blockedExecutions.length}\n`);

  if (blockedExecutions.length === 0) {
    console.log('✅ Nenhuma execução bloqueada encontrada hoje! Todas foram gravadas com sucesso.');
    return;
  }

  // Ordena cronologicamente para reprocessar na ordem original de envio
  blockedExecutions.sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));

  console.log(`📋 Lista de Execuções para Reprocessar:`);
  console.log(`──────────────────────────────────────────────────────────────────────`);
  blockedExecutions.slice(0, 15).forEach((b, idx) => {
    const hora = new Date(b.startedAt).toLocaleTimeString('pt-BR');
    console.log(
      ` ${idx + 1}. [${hora}] Exec #${b.execId} | Instância: ${b.instance || 'N/A'} | Sender: ${b.sender || 'N/A'}`
    );
    console.log(`    Lead: ${b.pushName || b.remoteJid} (${b.fromMe ? 'Loja -> Lead' : 'Lead -> Loja'})`);
    console.log(`    Texto: "${b.msgSnippet}"\n`);
  });

  if (blockedExecutions.length > 15) {
    console.log(` ... e mais ${blockedExecutions.length - 15} execuções anteriores.\n`);
  }

  // 4. Se for apenas DRY-RUN, finaliza com instruções
  if (!isExecute) {
    console.log(`══════════════════════════════════════════════════════════════════════`);
    console.log(`⚠️  MODO DRY-RUN CONCLUÍDO (Nenhuma mensagem foi reenviada).`);
    console.log(`Para disparar o reprocessamento real de todas as ${blockedExecutions.length} mensagens, execute:`);
    console.log(`\n  bun run scripts/replay_inbound_executions.js --execute\n`);
    console.log(`══════════════════════════════════════════════════════════════════════`);
    return;
  }

  // 5. Execução Real (Reenviando payloads)
  console.log(`🚀 Iniciando reprocessamento de ${blockedExecutions.length} mensagens...\n`);
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < blockedExecutions.length; i++) {
    const item = blockedExecutions[i];
    process.stdout.write(`[${i + 1}/${blockedExecutions.length}] Reenviando payload da Exec #${item.execId}... `);

    try {
      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': item.payload.apikey || 'FFE1348B-4A5A-4389-80A8-9F832B003764'
        },
        body: JSON.stringify(item.payload)
      });

      if (resp.ok) {
        successCount++;
        console.log(`✅ OK (${resp.status})`);
      } else {
        failCount++;
        const errText = await resp.text();
        console.log(`❌ Falha (${resp.status}): ${errText}`);
      }
    } catch (err) {
      failCount++;
      console.log(`❌ Erro de conexão: ${err.message}`);
    }

    // Intervalo de 250ms para não sobrecarregar banco / webhook
    await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\n══════════════════════════════════════════════════════════════════════`);
  console.log(`🎉 Reprocessamento Concluído!`);
  console.log(`   ✅ Sucesso: ${successCount}`);
  console.log(`   ❌ Falhas:  ${failCount}`);
  console.log(`══════════════════════════════════════════════════════════════════════\n`);
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err.message);
  process.exit(1);
});
