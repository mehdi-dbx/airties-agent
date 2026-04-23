import { memo } from 'react';
import { Users } from 'lucide-react';

export interface Technician {
  techId: string;
  name: string;
  zone: string;
  specialty: string;
  status: string;
}

export interface AvailableTechniciansCardProps {
  technicians: Technician[];
}

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  busy: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  offline: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
};

function AvailableTechniciansCardComponent({ technicians }: AvailableTechniciansCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Users className="size-4 text-[var(--primary)]" />
        <span className="font-semibold text-foreground text-sm">Available Technicians</span>
      </div>
      <div className="divide-y divide-border/50">
        {technicians.map((t) => {
          const statusClass = STATUS_STYLES[t.status.toLowerCase()] ?? STATUS_STYLES.available;
          return (
            <div key={t.techId} className="flex items-center gap-3 px-3 py-1.5 text-xs">
              <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                {t.techId}
              </span>
              <span className="flex-1 font-medium text-foreground">{t.name}</span>
              <span className="text-muted-foreground">{t.zone}</span>
              <span className="text-muted-foreground">{t.specialty}</span>
              <span className={`inline-flex rounded-full px-2 py-0.5 font-medium ${statusClass}`}>
                {t.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const AvailableTechniciansCard = memo(AvailableTechniciansCardComponent);
