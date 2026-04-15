import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { Wrench } from 'lucide-react'
import type { ArchNodeData } from '../types'

export function ToolNode({ data, selected }: NodeProps<Node<ArchNodeData>>) {
  return (
    <div
      className={`
        px-4 py-3 rounded-lg bg-amber-50 border border-amber-300 min-w-[180px] shadow-sm
        ${selected ? 'ring-2 ring-offset-1 ring-amber-400' : ''}
      `}
    >
      <Handle type="target" position={Position.Left} className="!bg-amber-400 !border-white" />
      <div className="flex items-center gap-2">
        <Wrench className="h-5 w-5 text-amber-600 shrink-0" />
        <div>
          <div className="text-sm font-semibold text-zinc-800 leading-tight">{data.label}</div>
          {data.subtitle && (
            <div className="text-[11px] text-zinc-500 mt-0.5">{data.subtitle}</div>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-amber-400 !border-white" />
    </div>
  )
}
