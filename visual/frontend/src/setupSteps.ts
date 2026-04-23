import type { SetupStep } from './types'

export const SETUP_STEPS: SetupStep[] = [
  {
    id: 'host',
    label: 'databricks host',
    title: 'DATABRICKS_HOST',
    choices: [
      { title: 'keep current',       desc: 'use host already set in .env.local',              action: 'done' },
      { title: 'use cli profile',    desc: 'pick from detected workspace profiles',            action: 'cfg-profile' },
      { title: 'set up new profile', desc: 'authenticate a brand new workspace via browser',  action: 'cfg-new' },
      { title: 'enter manually',     desc: 'paste a workspace URL directly',                  action: 'manual' },
    ],
  },
  {
    id: 'auth',
    label: 'authentication',
    title: 'DATABRICKS_TOKEN / profile',
    choices: [
      { title: 'keep current',         desc: 'use token already set in .env.local',                action: 'done' },
      { title: 'generate 7-day PAT',   desc: 'create a personal access token via cli profile',     action: 'exec-pat' },
      { title: 'enter token manually', desc: 'paste a dapi... token directly',                     action: 'manual' },
    ],
  },
  {
    id: 'warehouse',
    label: 'sql warehouse',
    title: 'DATABRICKS_WAREHOUSE_ID',
    choices: [
      { title: 'keep current',        desc: 'use warehouse already set in .env.local', action: 'done' },
      { title: 'pick from workspace', desc: 'list running warehouses in this workspace', action: 'cfg-warehouse' },
      { title: 'enter id manually',   desc: 'paste a warehouse ID directly',            action: 'manual' },
    ],
  },
  {
    id: 'schema',
    label: 'unity catalog schema',
    title: 'PROJECT_UNITY_CATALOG_SCHEMA',
    choices: [
      { title: 'create all assets',    desc: 'provision catalog, schema, tables, volume, genie from scratch', action: 'exec-assets' },
      { title: 'pick existing catalog', desc: 'choose from catalogs available in this workspace',             action: 'cfg-catalog' },
      { title: 'keep current',          desc: 'use schema already set in .env.local',                        action: 'done' },
      { title: 'enter manually',        desc: 'type catalog.schema directly',                                action: 'manual' },
    ],
  },
  {
    id: 'model',
    label: 'model endpoint',
    title: 'AGENT_MODEL_ENDPOINT',
    choices: [
      { title: 'same workspace',     desc: 'use this workspace auth — no extra config needed',          action: 'exec-same' },
      { title: 'use existing profile', desc: 'pick a cli profile for the FM workspace, generate PAT',  action: 'cfg-profile' },
      { title: 'set up new workspace', desc: 'run databricks auth login for a new FM host',            action: 'cfg-new' },
      { title: 'keep current',         desc: 'keep endpoint already set in .env.local',                action: 'done' },
      { title: 'enter manually',       desc: 'paste an endpoint URL and token directly',               action: 'manual' },
    ],
  },
  {
    id: 'genie',
    label: 'genie space',
    title: 'PROJECT_GENIE_ROOM',
    choices: [
      { title: 'pick existing space', desc: 'list genie spaces available in this workspace', action: 'cfg-genie' },
      { title: 'create new room',     desc: 'provision a new genie room with a name',        action: 'exec-genie' },
      { title: 'keep current',        desc: 'use space already set in .env.local',           action: 'done' },
      { title: 'enter id manually',   desc: 'paste a genie space ID directly',               action: 'manual' },
    ],
  },
  {
    id: 'ka',
    label: 'knowledge assistant',
    title: 'PROJECT_KA_AIRTIES',
    choices: [
      { title: 'provision from pdfs', desc: 'upload data/pdf/ files and create a new KA', action: 'exec-ka' },
      { title: 'keep current',        desc: 'use KA already set in .env.local',            action: 'done' },
      { title: 'enter id manually',   desc: 'paste a KA endpoint name directly',           action: 'manual' },
    ],
  },
  {
    id: 'mlflow',
    label: 'mlflow experiment',
    title: 'MLFLOW_EXPERIMENT_ID',
    choices: [
      { title: 'create new experiment', desc: 'run create_mlflow_experiment.py', action: 'exec-mlflow' },
      { title: 'keep current',          desc: 'use experiment already set in .env.local', action: 'done' },
      { title: 'enter id manually',     desc: 'paste an experiment ID directly',          action: 'manual' },
    ],
  },
  {
    id: 'grants',
    label: 'app grants',
    title: 'run_all_grants.sh',
    choices: [
      { title: 'run grant script', desc: 'apply UC table, routine and warehouse permissions', action: 'exec-grants' },
      { title: 'view issues',      desc: 'see which grants are missing',                      action: 'cfg-grants' },
    ],
  },
]
