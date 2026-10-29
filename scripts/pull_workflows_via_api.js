import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// 1. Obter credenciais do ambiente (CI/CD ou local)
let apiKey = process.env.STAGING_N8N_API_KEY || process.env.N8N_API_KEY;
let n8nHost = process.env.STAGING_N8N_HOST || process.env.N8N_HOST;

if (!apiKey || !n8nHost) {
  const envStaging = path.join(ROOT, '.env.staging');
  if (fs.existsSync(envStaging)) {
    const content = fs.readFileSync(envStaging, 'utf-8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('STAGING_N8N_API_KEY=')) {
        apiKey = trimmed.split('=').slice(1).join('=').trim();
      }
      if (trimmed.startsWith('STAGING_N8N_HOST=')) {
        n8nHost = trimmed.split('=').slice(1).join('=').trim();
      }
    });
  }
}

if (!apiKey || !n8nHost) {
  const envPath = path.join(ROOT, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('N8N_API_KEY=') || trimmed.startsWith('PROD_N8N_API_KEY=')) {
        apiKey = trimmed.split('=').slice(1).join('=').trim();
      }
      if (trimmed.startsWith('N8N_HOST=') || trimmed.startsWith('PROD_N8N_HOST=')) {
        n8nHost = trimmed.split('=').slice(1).join('=').trim();
      }
    });
  }
}

if (n8nHost) {
  n8nHost = n8nHost.replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim();
}

const API_BASE_URL = `https://${n8nHost}/api/v1`;

if (!apiKey || !n8nHost) {
  console.error('❌ N8N_API_KEY e N8N_HOST não foram encontrados no ambiente ou arquivos .env!');
  process.exit(1);
}

// Pastas de workflows locais do AdsWhats
const WORKFLOW_DIRS = [
  path.join(ROOT, 'agente', 'workflows', 'core'),
  path.join(ROOT, 'agente', 'workflows', 'panel'),
  path.join(ROOT, 'agente', 'workflows', 'panel', 'actions'),
  path.join(ROOT, 'agente', 'workflows', 'utils'),
];

function getDestDir(workflowName) {
  const name = workflowName.trim();
  if (name.startsWith('ADSWHATHS-PANEL-ACTION-') || name.startsWith('ADSWHATS-PANEL-ACTION-')) {
    return path.join(ROOT, 'agente', 'workflows', 'panel', 'actions');
  }
  if (name.includes('PANEL') || name.includes('DASHBOARD')) {
    return path.join(ROOT, 'agente', 'workflows', 'panel');
  }
  if (name.startsWith('ADSWHATHS') || name.startsWith('ADSWHATS')) {
    return path.join(ROOT, 'agente', 'workflows', 'core');
  }
  return path.join(ROOT, 'agente', 'workflows', 'utils');
}

// Mapear caminhos de arquivos locais por Nome do Workflow
function mapLocalWorkflows() {
  const map = new Map();
  for (const dir of WORKFLOW_DIRS) {
    if (!fs.existsSync(dir)) continue;
    fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .forEach(f => {
        const filePath = path.join(dir, f);
        try {
          const raw = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(raw);
          if (data.name) {
            map.set(data.name.trim(), filePath);
          }
        } catch (e) {
          console.error(`⚠️ Falha ao analisar arquivo local ${f}: ${e.message}`);
        }
      });
  }
  return map;
}

// Filtro opcional por argumento (ex: nome do workflow ou ID)
const targetArg = process.argv[2] ? process.argv[2].trim() : null;

async function run() {
  console.log('\n📥 AdsWhats Monitor — Baixando Workflows do n8n para o Repositório Local');
  console.log('═'.repeat(70));
  console.log(`🌐 Host: https://${n8nHost}`);

  try {
    const localMap = mapLocalWorkflows();
    console.log(`📋 Workflows locais mapeados: ${localMap.size}`);

    console.log('📡 Buscando workflows no n8n...');
    let workflows = [];
    let limit = 100;
    let cursor = null;
    let hasMore = true;

    while (hasMore) {
      let url = `${API_BASE_URL}/workflows?limit=${limit}`;
      if (cursor) {
        url += `&cursor=${encodeURIComponent(cursor)}`;
      }

      const listRes = await fetch(url, {
        headers: { 'X-N8N-API-KEY': apiKey }
      });
      if (!listRes.ok) {
        throw new Error(`Falha ao obter workflows do n8n: ${listRes.statusText}`);
      }
      const data = await listRes.json();
      const pageWorkflows = data.data || [];
      workflows = workflows.concat(pageWorkflows);

      if (data.nextCursor) {
        cursor = data.nextCursor;
      } else {
        hasMore = false;
      }
    }

    // Filtrar apenas workflows com prefixo ADSWHATHS / ADSWHATS ou que correspondam ao targetArg
    workflows = workflows.filter(wf => {
      if (wf.isArchived) return false;
      const name = wf.name.trim();
      const isAdsWhats = name.startsWith('ADSWHATHS') || name.startsWith('ADSWHATS') || localMap.has(name);
      if (!isAdsWhats) return false;
      if (targetArg) {
        return name.toLowerCase().includes(targetArg.toLowerCase()) || wf.id === targetArg;
      }
      return true;
    });

    console.log(`📡 Workflows selecionados (${workflows.length}): ${workflows.map(w => `"${w.name}"`).join(', ')}`);

    let updatedCount = 0;
    let createdCount = 0;

    for (const wf of workflows) {
      const nameKey = wf.name.trim();

      // Buscar workflow completo com nós e conexões
      let fullWf = wf;
      try {
        const detailRes = await fetch(`${API_BASE_URL}/workflows/${wf.id}`, {
          headers: { 'X-N8N-API-KEY': apiKey }
        });
        if (detailRes.ok) {
          fullWf = await detailRes.json();
        } else {
          console.error(`  ⚠️ Falha ao buscar detalhes do workflow "${wf.name}" (${wf.id}): ${detailRes.statusText}`);
          continue;
        }
      } catch (err) {
        console.error(`  ⚠️ Erro ao buscar detalhes do workflow "${wf.name}": ${err.message}`);
        continue;
      }

      const cleanPayload = {
        name: fullWf.name,
        nodes: fullWf.nodes,
        connections: fullWf.connections,
        settings: fullWf.settings || { executionOrder: 'v1' }
      };

      if (localMap.has(nameKey)) {
        const localPath = localMap.get(nameKey);
        fs.writeFileSync(localPath, JSON.stringify(cleanPayload, null, 2), 'utf-8');
        console.log(`  💾 ATUALIZADO LOCAL: "${wf.name}" -> ${path.relative(ROOT, localPath)}`);
        updatedCount++;
      } else {
        const destDir = getDestDir(nameKey);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        const safeName = nameKey.replace(/[^a-zA-Z0-9 _-]/g, '_');
        const newLocalPath = path.join(destDir, `${safeName}.json`);
        fs.writeFileSync(newLocalPath, JSON.stringify(cleanPayload, null, 2), 'utf-8');
        console.log(`  🆕 CRIADO NOVO: "${wf.name}" -> ${path.relative(ROOT, newLocalPath)}`);
        createdCount++;
      }
    }

    console.log('\n' + '═'.repeat(70));
    console.log(`✨ Sincronização concluída com sucesso!`);
    console.log(`   - ${updatedCount} workflows locais atualizados.`);
    console.log(`   - ${createdCount} workflows novos baixados.`);
    console.log('═'.repeat(70));

  } catch (err) {
    console.error('❌ Erro durante a importação:', err.message);
    process.exit(1);
  }
}

run();
