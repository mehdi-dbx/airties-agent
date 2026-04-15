export type NodeKind = 'agent' | 'llm' | 'tool' | 'genie' | 'data'
export type DataVariant = 'table' | 'function' | 'procedure'

export interface ArchNodeData extends Record<string, unknown> {
  kind: NodeKind
  label: string
  subtitle?: string
  sourceFile?: string
  meta?: Record<string, string>
  dataVariant?: DataVariant
}

export interface ArchNode {
  id: string
  type: NodeKind
  position: { x: number; y: number }
  data: ArchNodeData
}

export interface ArchEdge {
  id: string
  source: string
  target: string
  label?: string
  animated?: boolean
}

export interface GraphResponse {
  nodes: ArchNode[]
  edges: ArchEdge[]
  meta: {
    projectRoot: string
    generatedAt: string
  }
}
