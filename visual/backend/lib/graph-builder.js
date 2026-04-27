'use strict'

const fs   = require('fs')
const path = require('path')
const yaml = require('js-yaml')

const PROJECT_ROOT = path.resolve(__dirname, '../../..')
const APP_YAML     = path.join(PROJECT_ROOT, 'app.yaml')

function readAppYaml() {
  try {
    return yaml.load(fs.readFileSync(APP_YAML, 'utf8')) || {}
  } catch {
    return {}
  }
}

function extractEnvVars(appYaml) {
  const vars = {}
  for (const e of (appYaml.env || [])) {
    vars[e.name] = e.value || (e.valueFrom ? `<secret:${e.valueFrom}>` : '')
  }
  return vars
}

function parseModelName(endpoint) {
  const m = (endpoint || '').match(/serving-endpoints\/([^/]+)\/invocations/)
  return m ? m[1] : (endpoint || 'unknown')
}

function buildGraph() {
  const appYaml  = readAppYaml()
  const envVars  = extractEnvVars(appYaml)
  const endpoint = envVars['AGENT_MODEL_ENDPOINT'] || ''
  const modelName = parseModelName(endpoint)
  const schema   = envVars['PROJECT_UNITY_CATALOG_SCHEMA'] || 'vibe.main'
  const [catalog, schemaName] = schema.split('.')

  const nodes = [
    // Column 0 — Agent
    {
      id: 'agent',
      type: 'agent',
      position: { x: 80, y: 300 },
      data: {
        kind: 'agent',
        label: 'Airties WiFi Agent',
        subtitle: 'LangGraph ResponsesAgent',
        sourceFile: 'agent/agent.py',
        meta: {
          framework: 'LangGraph',
          server: 'MLflow GenAI',
          port: '8000',
          contextMgmt: 'summarization + truncation',
        },
      },
    },

    // Column 1 — LLM + Tools + Genie
    {
      id: 'llm',
      type: 'llm',
      position: { x: 380, y: 60 },
      data: {
        kind: 'llm',
        label: modelName,
        subtitle: 'Cross-workspace model endpoint',
        sourceFile: 'app.yaml',
        meta: {
          endpoint: endpoint || '(not set)',
          tokenEnvVar: 'AGENT_MODEL_TOKEN',
        },
      },
    },
    {
      id: 'tool-ka',
      type: 'tool',
      position: { x: 380, y: 220 },
      data: {
        kind: 'tool',
        label: 'query_airties_ka',
        subtitle: 'Knowledge Assistant tool',
        sourceFile: 'tools/query_airties_ka.py',
        meta: {
          endpointEnvVar: 'PROJECT_KA_AIRTIES',
          scope: 'WiFi troubleshooting, device specs, setup guides',
        },
      },
    },
    {
      id: 'genie',
      type: 'genie',
      position: { x: 380, y: 400 },
      data: {
        kind: 'genie',
        label: 'Genie (WiFi Ops)',
        subtitle: 'MCP-based Genie space',
        sourceFile: 'agent/agent.py',
        meta: {
          spaceIdEnvVar: 'PROJECT_GENIE_ROOM',
          mcpServerName: 'genie-airties',
          transport: 'DatabricksMultiServerMCPClient',
          scope: 'WiFi events, speed tests, mesh nodes, client devices',
        },
      },
    },

    // Column 2 — KA endpoint
    {
      id: 'ka-endpoint',
      type: 'data',
      position: { x: 700, y: 220 },
      data: {
        kind: 'data',
        label: 'Airties KA',
        subtitle: 'Knowledge Assistant endpoint',
        dataVariant: 'function',
        meta: {
          type: 'Serving endpoint',
          sources: 'AirTies product manuals (PDF)',
          models: 'Air 4960, 4930, 4410, 4920',
        },
      },
    },

    // Column 2 — Delta tables
    {
      id: 'data-wifi-events',
      type: 'data',
      position: { x: 700, y: 380 },
      data: {
        kind: 'data',
        label: 'wifi_events',
        subtitle: `${catalog}.${schemaName}.wifi_events`,
        dataVariant: 'table',
        sourceFile: 'data/init/create_wifi_events.sql',
        meta: {
          columns: 'event_type, device_mac, severity, timestamp',
        },
      },
    },
    {
      id: 'data-mesh-nodes',
      type: 'data',
      position: { x: 700, y: 500 },
      data: {
        kind: 'data',
        label: 'mesh_nodes',
        subtitle: `${catalog}.${schemaName}.mesh_nodes`,
        dataVariant: 'table',
        sourceFile: 'data/init/create_mesh_nodes.sql',
        meta: {
          columns: 'node_id, model, status, signal_strength, band',
        },
      },
    },
    {
      id: 'data-client-devices',
      type: 'data',
      position: { x: 1020, y: 380 },
      data: {
        kind: 'data',
        label: 'client_devices',
        subtitle: `${catalog}.${schemaName}.client_devices`,
        dataVariant: 'table',
        sourceFile: 'data/init/create_client_devices.sql',
        meta: {
          columns: 'device_mac, device_name, connected_node, band, rssi',
        },
      },
    },
    {
      id: 'data-speed-tests',
      type: 'data',
      position: { x: 1020, y: 500 },
      data: {
        kind: 'data',
        label: 'speed_tests',
        subtitle: `${catalog}.${schemaName}.speed_tests`,
        dataVariant: 'table',
        sourceFile: 'data/init/create_speed_tests.sql',
        meta: {
          columns: 'download_mbps, upload_mbps, latency_ms, node_id',
        },
      },
    },
  ]

  const edges = [
    { id: 'e-agent-llm',       source: 'agent',     target: 'llm',               label: 'uses model' },
    { id: 'e-agent-ka',        source: 'agent',     target: 'tool-ka',           label: 'has tool' },
    { id: 'e-agent-genie',     source: 'agent',     target: 'genie',             label: 'has MCP tool' },
    { id: 'e-ka-endpoint',     source: 'tool-ka',   target: 'ka-endpoint',       label: 'calls' },
    { id: 'e-genie-wifi',      source: 'genie',     target: 'data-wifi-events',  label: 'queries', animated: true },
    { id: 'e-genie-mesh',      source: 'genie',     target: 'data-mesh-nodes',   label: 'queries', animated: true },
    { id: 'e-genie-clients',   source: 'genie',     target: 'data-client-devices', label: 'queries', animated: true },
    { id: 'e-genie-speed',     source: 'genie',     target: 'data-speed-tests',  label: 'queries', animated: true },
  ]

  return {
    nodes,
    edges,
    meta: {
      projectRoot: PROJECT_ROOT,
      generatedAt: new Date().toISOString(),
    },
  }
}

module.exports = { buildGraph }
