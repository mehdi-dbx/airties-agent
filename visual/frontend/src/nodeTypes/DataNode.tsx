import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { Table2, FunctionSquare, Play } from 'lucide-react'
import type { ArchNodeData } from '../types'

const VARIANT_CONFIG = {
  table:     { Icon: Table2,          badge: 'TABLE' },
  function:  { Icon: FunctionSquare,  badge: 'FUNCTION' },
  procedure: { Icon: Play,            badge: 'PROCEDURE' },
} as const

export function DataNode({ data, selected }: NodeProps<Node<ArchNodeData>>) {
  const variant = data.dataVariant ?? 'table'
  const { Icon, badge } = VARIANT_CONFIG[variant]

  return (
    <div
      className={`
        px-4 py-3 rounded-lg bg-teal-50 border border-teal-300 min-w-[180px] shadow-sm
        ${selected ? 'ring-2 ring-offset-1 ring-teal-400' : ''}
      `}
    >
      <Handle type="target" position={Position.Left} className="!bg-teal-400 !border-white" />
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-teal-600 shrink-0" />
        <div>
          <div className="text-sm font-semibold text-zinc-800 leading-tight">{data.label}</div>
          {data.subtitle && (
            <div className="text-[11px] text-zinc-500 mt-0.5">{data.subtitle}</div>
          )}
          <span className="mt-1 inline-block text-[9px] font-medium tracking-wider uppercase px-1.5 py-0.5 rounded bg-teal-100 text-teal-700">
            {badge}
          </span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-teal-400 !border-white" />
    </div>
  )
}
