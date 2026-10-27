import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// 1. Obter credenciais do ambiente (CI/CD ou local)
let apiKey = process.env.N8N_API_KEY;
let n8nHost = process.env.N8N_HOST;

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

// Whitelist de campos aceitos pela API do n8n no objeto settings
const ALLOWED_SETTINGS_KEYS = new Set([
  'executionOrder',
  'saveDataErrorExecution',
  'saveDataSuccessExecution',
  'saveManualExecutions',
  'saveExecutionProgress',
  'executionTimeout',
  'timezone',
  'callerPolicy',
  'callerIds',
]);

function sanitizeSettings(settings) {
  if (!settings || typeof settings !== 'object') return { executionOrder: 'v1' };
  const clean = {};
  for (const [k, v] of Object.entries(settings)) {
    if (ALLOWED_SETTINGS_KEYS.has(k)) {
      clean[k] = v;
    }
  }
  if (!clean.executionOrder) clean.executionOrder = 'v1';
  return clean;
}

// Diretórios onde os workflows ficam organizados
const WORKFLOW_DIRS = [
  path.join(ROOT, 'agente', 'workflows', 'core'),
  path.join(ROOT, 'agente', 'workflows', 'actions'),
  path.join(ROOT, 'agente', 'workflows', 'panel'),
  path.join(ROOT, 'agente', 'workflows', 'utils'),
];

function collectWorkflows() {
  const list = [];
  function scan(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        try {
          const raw = fs.readFileSync(fullPath, 'utf-8');
          const parsed = JSON.parse(raw);
          parsed._filePath = path.relative(ROOT, fullPath).replace(/\\/g, '/');
          list.push(parsed);
        } catch (err) {
          console.warn(`⚠️ Não foi possível ler o arquivo ${fullPath}: ${err.message}`);
        }
      }
    }
  }

  for (const dir of WORKFLOW_DIRS) {
    scan(dir);
  }
  return list;
}

// Ordenação topológica por dependência (sub-workflows sobem antes dos workflows pais)
function sortWorkflowsByDependency(workflows) {
  const nameToWf = new Map();
  workflows.forEach(wf => nameToWf.set(wf.name.trim(), wf));

  const dependencies = new Map();
  workflows.forEach(wf => {
    const deps = new Set();
    if (Array.isArray(wf.nodes)) {
      wf.nodes.forEach(node => {
        if (node.type === 'n8n-nodes-base.executeWorkflow') {
          let cachedName = node.parameters?.workflowId?.cachedResultName;
          if (!cachedName && node.name) {
            const cleanNodeName = node.name.replace(/^(Call\s+|Action:\s+|Call\s+')/, '').replace(/'$/, '').trim();
            if (nameToWf.has(cleanNodeName)) {
              cachedName = cleanNodeName;
            }
          }
          if (cachedName && nameToWf.has(cachedName.trim())) {
            deps.add(cachedName.trim());
          }
        }
      });
    }
    dependencies.set(wf.name.trim(), deps);
  });

  const visited = new Set();
  const temp = new Set();
  const sorted = [];

  function visit(name) {
    if (temp.has(name)) return;
    if (!visited.has(name)) {
      temp.add(name);
      const deps = dependencies.get(name) || new Set();
      for (const dep of deps) {
        visit(dep);
      }
      temp.delete(name);
      visited.add(name);
      const wf = nameToWf.get(name);
      if (wf) {
        sorted.push(wf);
      }
    }
  }

  for (const wf of workflows) {
    visit(wf.name.trim());
  }

  return sorted;
}

async function run() {
  console.log('\n🚀 AdsWhats Monitor — Deploy Automatizado via API Oficial do n8n');
  console.log('═'.repeat(70));
  console.log(`🌐 Destino: https://${n8nHost}`);

  try {
    const rawWorkflows = collectWorkflows();
    if (rawWorkflows.length === 0) {
      console.log('ℹ️ Nenhum workflow .json encontrado nas pastas configuradas em agente/workflows/. Encerrando.');
      return;
    }

    let localWorkflows = sortWorkflowsByDependency(rawWorkflows);
    console.log(`📦 Encontrados ${localWorkflows.length} workflows totais no repositório.`);

    // Suporte a deploy de workflow único via linha de comando (ex: bun scripts/deploy_workflows_via_api.js meuarquivo.json)
    const targetArg = process.argv[2];
    if (targetArg) {
      const cleanArg = targetArg.replace(/\\/g, '/');
      localWorkflows = localWorkflows.filter(wf => 
        wf._filePath.includes(cleanArg) || 
        wf._filePath.endsWith(cleanArg) ||
        wf.name.toLowerCase() === cleanArg.toLowerCase()
      );
      if (localWorkflows.length === 0) {
        console.error(`❌ Erro: Nenhum workflow correspondente a "${targetArg}" foi encontrado.`);
        process.exit(1);
      }
      console.log(`🎯 Filtrado para atualizar apenas: "${localWorkflows[0].name}" (${localWorkflows[0]._filePath})`);
    }

    // 1. Obter workflows existentes no n8n de destino
    console.log('\n📡 Consultando workflows existentes no n8n...');
    let existingWorkflows = [];
    let limit = 100;
    let cursor = null;
    let hasMore = true;

    while (hasMore) {
      let url = `${API_BASE_URL}/workflows?limit=${limit}`;
      if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;

      const listRes = await fetch(url, {
        headers: { 'X-N8N-API-KEY': apiKey }
      });
      if (!listRes.ok) {
        throw new Error(`Falha ao obter workflows da API do n8n: ${listRes.statusText}`);
      }
      const data = await listRes.json();
      const pageWorkflows = (data.data || []).filter(w => !(w.isArchived || w.archived));
      existingWorkflows = existingWorkflows.concat(pageWorkflows);
      
      if (data.nextCursor) {
        cursor = data.nextCursor;
      } else {
        hasMore = false;
      }
    }

    const existingMap = new Map(); // Nome -> { id, active }
    existingWorkflows.forEach(w => {
      const current = existingMap.get(w.name.trim());
      if (!current || (w.active && !current.active)) {
        existingMap.set(w.name.trim(), { id: w.id, active: w.active });
      }
    });

    // 2. Mapear credenciais dinamicamente
    console.log('📡 Buscando credenciais configuradas no n8n de destino...');
    const credsMap = new Map();
    const credsByName = new Map();
    try {
      let credsCursor = null;
      let hasMoreCreds = true;
      while (hasMoreCreds) {
        let credsUrl = `${API_BASE_URL}/credentials?limit=${limit}`;
        if (credsCursor) credsUrl += `&cursor=${encodeURIComponent(credsCursor)}`;
        
        const credRes = await fetch(credsUrl, {
          headers: { 'X-N8N-API-KEY': apiKey }
        });
        if (credRes.ok) {
          const credData = await credRes.json();
          const targetCreds = credData.data || [];
          targetCreds.forEach(c => {
            const trimmedName = c.name.trim();
            credsMap.set(`${trimmedName}|${c.type}`, c.id);
            credsByName.set(trimmedName.toUpperCase(), c.id);
          });
          if (credData.nextCursor) {
            credsCursor = credData.nextCursor;
          } else {
            hasMoreCreds = false;
          }
        } else {
          hasMoreCreds = false;
        }
      }
      console.log(`   📡 Credenciais mapeadas: ${credsMap.size} (${credsByName.size} nomes únicos)`);
    } catch (err) {
      console.log(`   ⚠️ Aviso ao listar credenciais: ${err.message}`);
    }

    // 3. Mapear IDs locais e preparar criação/atualização
    const localNameToId = new Map();
    localWorkflows.forEach(wf => {
      const existing = existingMap.get(wf.name.trim());
      if (existing) {
        localNameToId.set(wf.name.trim(), existing.id);
      }
    });

    console.log('\n📥 [Passo 1/2] Sincronizando workflows no n8n...');
    for (const wf of localWorkflows) {
      const isUpdate = existingMap.has(wf.name.trim());
      let targetId = localNameToId.get(wf.name.trim());

      // Ajusta chamadas a sub-workflows para apontar para o ID correto no servidor
      if (Array.isArray(wf.nodes)) {
        wf.nodes.forEach(node => {
          if (node.type === 'n8n-nodes-base.executeWorkflow') {
            let targetSubName = node.parameters?.workflowId?.cachedResultName;
            if (!targetSubName && node.name) {
              const clean = node.name.replace(/^(Call\s+|Action:\s+|Call\s+')/, '').replace(/'$/, '').trim();
              if (localNameToId.has(clean)) targetSubName = clean;
            }
            if (targetSubName && localNameToId.has(targetSubName.trim())) {
              const realServerId = localNameToId.get(targetSubName.trim());
              if (node.parameters && typeof node.parameters.workflowId === 'object') {
                node.parameters.workflowId.value = realServerId;
              } else if (node.parameters) {
                node.parameters.workflowId = realServerId;
              }
            }
          }

          // Ajusta referências de credenciais se mapeadas
          if (node.credentials && typeof node.credentials === 'object') {
            for (const [credType, credObj] of Object.entries(node.credentials)) {
              const credName = (credObj.name || credObj.cachedResultName || '').trim();
              if (credName) {
                const keyWithType = `${credName}|${credType}`;
                if (credsMap.has(keyWithType)) {
                  credObj.id = credsMap.get(keyWithType);
                } else if (credsByName.has(credName.toUpperCase())) {
                  credObj.id = credsByName.get(credName.toUpperCase());
                }
              }
            }
          }
        });
      }

      const payload = {
        name: wf.name,
        nodes: wf.nodes,
        connections: wf.connections,
        settings: sanitizeSettings(wf.settings)
      };

      if (isUpdate) {
        const updateRes = await fetch(`${API_BASE_URL}/workflows/${targetId}`, {
          method: 'PUT',
          headers: {
            'X-N8N-API-KEY': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (updateRes.ok) {
          console.log(`  🔄 ATUALIZADO: "${wf.name}" (id: ${targetId})`);
        } else {
          const errText = await updateRes.text();
          console.error(`  ❌ Falha ao atualizar "${wf.name}": ${errText}`);
        }
      } else {
        const createRes = await fetch(`${API_BASE_URL}/workflows`, {
          method: 'POST',
          headers: {
            'X-N8N-API-KEY': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (createRes.ok) {
          const created = await createRes.json();
          targetId = created.id;
          localNameToId.set(wf.name.trim(), targetId);
          console.log(`  ✨ CRIADO: "${wf.name}" (id: ${targetId})`);
        } else {
          const errText = await createRes.text();
          console.error(`  ❌ Falha ao criar "${wf.name}": ${errText}`);
        }
      }

      // 4. Ativar workflow
      if (targetId) {
        try {
          const actRes = await fetch(`${API_BASE_URL}/workflows/${targetId}/activate`, {
            method: 'POST',
            headers: { 'X-N8N-API-KEY': apiKey }
          });
          if (actRes.ok) {
            console.log(`    ⚡ Ativado com sucesso.`);
          }
        } catch (actErr) {
          console.warn(`    ⚠️ Não foi possível ativar "${wf.name}": ${actErr.message}`);
        }
      }
    }

    console.log('\n' + '═'.repeat(70));
    console.log('✅ Deploy de workflows concluído com sucesso!');
  } catch (error) {
    console.error(`\n❌ Falha durante a execução do deploy: ${error.message}`);
    process.exit(1);
  }
}

run();
