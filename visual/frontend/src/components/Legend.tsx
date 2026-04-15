const ITEMS = [
  { color: 'bg-blue-300',   label: 'Agent' },
  { color: 'bg-violet-300', label: 'LLM' },
  { color: 'bg-amber-300',  label: 'Tool' },
  { color: 'bg-rose-300',   label: 'Genie (MCP)' },
  { color: 'bg-teal-300',   label: 'Data (table / function / procedure)' },
]

export function Legend() {
  return (
    <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-sm border border-zinc-200 rounded-lg px-4 py-3 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Legend</p>
      <div className="flex flex-col gap-1.5">
        {ITEMS.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${color} shrink-0`} />
            <span className="text-xs text-zinc-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
