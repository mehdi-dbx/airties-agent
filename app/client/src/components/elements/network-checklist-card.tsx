import { memo } from 'react';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';

export interface ChecklistTask {
  name: string;
  status: string;
}

export interface NetworkChecklistCardProps {
  location: string;
  tasks: ChecklistTask[];
  health: string;
}

const HEALTH_COLOURS: Record<string, string> = {
  good: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  degraded: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  checking: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
};

const TASK_ICONS: Record<string, JSX.Element> = {
  pass: <CheckCircle2 className="size-3.5 text-emerald-500" />,
  fail: <XCircle className="size-3.5 text-red-500" />,
  warning: <Circle className="size-3.5 text-amber-500" />,
  running: <Loader2 className="size-3.5 animate-spin text-sky-500" />,
  pending: <Circle className="size-3.5 text-muted-foreground" />,
};

const TASK_ROW_STYLES: Record<string, string> = {
  pass: '',
  fail: 'bg-red-50 dark:bg-red-900/10',
  warning: 'bg-amber-50 dark:bg-amber-900/10',
  running: '',
  pending: '',
};

function NetworkChecklistCardComponent({ location, tasks, health }: NetworkChecklistCardProps) {
  const healthLower = health.toLowerCase();
  const healthClass = HEALTH_COLOURS[healthLower] ?? HEALTH_COLOURS.checking;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="font-semibold text-foreground text-sm">Network Diagnostics — {location}</span>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${healthClass}`}>
          {health}
        </span>
      </div>
      <div className="divide-y divide-border/50">
        {tasks.map((task) => {
          const statusKey = task.status.toLowerCase();
          const icon = TASK_ICONS[statusKey] ?? TASK_ICONS.pending;
          const rowClass = TASK_ROW_STYLES[statusKey] ?? '';
          return (
            <div key={task.name} className={`flex items-center gap-2 px-3 py-1.5 text-xs ${rowClass}`}>
              {icon}
              <span className="flex-1 text-foreground">{task.name}</span>
              <span className="text-muted-foreground">{task.status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const NetworkChecklistCard = memo(NetworkChecklistCardComponent);
