import { X } from 'lucide-react'
import type { ArchNode } from '../types'

const KIND_LABELS: Record<string, string> = {
  agent: 'Agent',
  llm:   'LLM',
  tool:  'Tool',
  genie: 'Genie',
  data:  'Data',
}

const KIND_COLORS: Record<string, string> = {
  agent: 'bg-blue-100 text-blue-700',
  llm:   'bg-violet-100 text-violet-700',
  tool:  'bg-amber-100 text-amber-700',
  genie: 'bg-rose-100 text-rose-700',
  data:  'bg-teal-100 text-teal-700',
}

interface NodeDetailPanelProps {
  node: ArchNode | null
  onClose: () => void
}

export function NodeDetailPanel({ node, onClose }: NodeDetailPanelProps) {
  return (
    <div
      className={`
        absolute top-0 right-0 h-full w-72 bg-white border-l border-zinc-200 shadow-lg z-20
        flex flex-col transition-transform duration-200 ease-in-out
        ${node ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      {node && (
        <>
          {/* Header */}
          <div className="flex items-start justify-between p-4 border-b border-zinc-100">
            <div>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${KIND_COLORS[node.data.kind] ?? 'bg-zinc-100 text-zinc-600'}`}
              >
                {KIND_LABELS[node.data.kind] ?? node.data.kind}
              </span>
              <h2 className="mt-2 text-base font-semibold text-zinc-800 break-words">
                {node.data.label}
              </h2>
              {node.data.subtitle && (
                <p className="text-xs text-zinc-500 mt-0.5">{node.data.subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-2 p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 shrink-0"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Source file */}
            {node.data.sourceFile && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Source
                </p>
                <code className="block text-xs bg-zinc-100 text-zinc-700 rounded px-2 py-1.5 break-all font-mono">
                  {node.data.sourceFile}
                </code>
              </div>
            )}

            {/* Meta */}
            {node.data.meta && Object.keys(node.data.meta).length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Details
                </p>
                <table className="w-full text-xs">
                  <tbody>
                    {Object.entries(node.data.meta).map(([k, v]) => (
                      <tr key={k} className="border-b border-zinc-100 last:border-0">
                        <td className="py-1.5 pr-2 text-zinc-400 font-medium whitespace-nowrap align-top">
                          {k}
                        </td>
                        <td className="py-1.5 text-zinc-700 break-all align-top">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
