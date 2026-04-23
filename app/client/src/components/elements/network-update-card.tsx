import { memo } from 'react';
import { Radio } from 'lucide-react';

export interface NetworkUpdateCardProps {
  location: string;
  body: string;
  technician?: { name: string; zone: string };
  nodes: Array<{ nodeId: string; status: 'online' | 'offline' | 'degraded' }>;
}

const NODE_STYLES: Record<string, string> = {
  online: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  offline: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  degraded: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
};

function NetworkUpdateCardComponent({ location, body, technician, nodes }: NetworkUpdateCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <Radio className="size-4 text-[var(--primary)]" />
        <span className="font-semibold text-foreground text-sm">Network Update — {location}</span>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">{body}</p>
      {technician && (
        <p className="mb-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Technician:</span> {technician.name} ({technician.zone})
        </p>
      )}
      {nodes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {nodes.map((n) => (
            <span
              key={n.nodeId}
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${NODE_STYLES[n.status] ?? NODE_STYLES.offline}`}
            >
              {n.nodeId}: {n.status}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export const NetworkUpdateCard = memo(NetworkUpdateCardComponent);
