import { useEffect, useState, useCallback } from 'react'
import { ReactFlowProvider, type Node, type NodeMouseHandler } from '@xyflow/react'
import { ArchCanvas } from './components/ArchCanvas'
import { Legend } from './components/Legend'
import { NodeDetailPanel } from './components/NodeDetailPanel'
import type { GraphResponse, ArchNode, ArchNodeData } from './types'

export default function App() {
  const [graph, setGraph]         = useState<GraphResponse | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [selected, setSelected]   = useState<ArchNode | null>(null)

  useEffect(() => {
    fetch('/api/graph')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<GraphResponse>
      })
      .then(setGraph)
      .catch((e: unknown) => setError(String(e)))
  }, [])

  const onNodeClick: NodeMouseHandler<Node<ArchNodeData>> = useCallback((_event, node) => {
    setSelected(node as ArchNode)
  }, [])

  const closePanel = useCallback(() => setSelected(null), [])

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-50">
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
          Failed to load architecture graph: {error}
        </div>
      </div>
    )
  }

  if (!graph) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-50">
        <div className="text-sm text-zinc-400">Loading architecture…</div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Title bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-white/80 backdrop-blur-sm border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-800">Agent Forge</span>
          <span className="text-xs text-zinc-400">— Architecture</span>
        </div>
        <span className="text-[10px] text-zinc-400">
          {graph.meta.projectRoot.split('/').slice(-1)[0]}
        </span>
      </div>

      {/* Canvas */}
      <div className="h-full w-full pt-9">
        <ReactFlowProvider>
          <ArchCanvas
            nodes={graph.nodes as Node<ArchNodeData>[]}
            edges={graph.edges}
            onNodeClick={onNodeClick}
          />
          <Legend />
        </ReactFlowProvider>
      </div>

      {/* Detail panel */}
      <NodeDetailPanel node={selected} onClose={closePanel} />
    </div>
  )
}
