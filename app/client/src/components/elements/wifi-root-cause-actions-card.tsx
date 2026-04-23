import { memo, useState } from 'react';
import { Wrench } from 'lucide-react';

export interface WifiTechnician {
  techId: string;
  name: string;
  zone: string;
  specialty: string;
  status: string;
}

export interface WifiAction {
  actionId: string;
  question: string;
}

export interface WifiRootCauseActionsCardProps {
  technicians: WifiTechnician[];
  actions: WifiAction[];
  onConfirm: (selectedActionIds: string[]) => void;
  disabled?: boolean;
}

function WifiRootCauseActionsCardComponent({
  technicians,
  actions,
  onConfirm,
  disabled,
}: WifiRootCauseActionsCardProps) {
  const [selected, setSelected] = useState<Set<number>>(() => new Set(actions.map((_, i) => i)));

  const toggle = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Wrench className="size-4 text-[var(--primary)]" />
        <span className="font-semibold text-foreground text-sm">Proposed Actions</span>
      </div>

      {technicians.length > 0 && (
        <div className="border-b border-border/50 px-3 py-2">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Assigned Technicians</span>
          <div className="flex flex-wrap gap-1.5">
            {technicians.map((t) => (
              <span key={t.techId} className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                {t.techId} — {t.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="divide-y divide-border/50">
        {actions.map((action, i) => (
          <button
            type="button"
            key={action.actionId}
            onClick={() => !disabled && toggle(i)}
            disabled={disabled}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted/50 disabled:opacity-60"
          >
            <div
              className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                selected.has(i)
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                  : 'border-border bg-background'
              }`}
            >
              {selected.has(i) && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-foreground">{action.question}</span>
          </button>
        ))}
      </div>

      {!disabled && (
        <div className="border-t border-border px-3 py-2">
          <button
            type="button"
            onClick={() => {
              const ids = actions.filter((_, i) => selected.has(i)).map((a) => a.actionId);
              onConfirm(ids);
            }}
            disabled={selected.size === 0}
            className="rounded-lg bg-[var(--primary)] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#2222B8] disabled:opacity-50"
          >
            Execute Selected ({selected.size})
          </button>
        </div>
      )}
    </div>
  );
}

export const WifiRootCauseActionsCard = memo(WifiRootCauseActionsCardComponent);
