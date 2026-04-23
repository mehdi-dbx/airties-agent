import { memo } from 'react';
import { Wifi } from 'lucide-react';

export interface WifiDiagnosisCardProps {
  location: string;
  issue: string;
  severity: string;
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
  low: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
};

function WifiDiagnosisCardComponent({ location, issue, severity }: WifiDiagnosisCardProps) {
  const sevLower = severity.toLowerCase();
  const sevClass = SEVERITY_STYLES[sevLower] ?? SEVERITY_STYLES.medium;

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <Wifi className="size-4 text-[var(--primary)]" />
        <span className="font-semibold text-foreground text-sm">Diagnosis Started</span>
        <span className={`ml-auto inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${sevClass}`}>
          {severity}
        </span>
      </div>
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        <div><span className="font-medium text-foreground">Location:</span> {location}</div>
        <div><span className="font-medium text-foreground">Issue:</span> {issue}</div>
      </div>
    </div>
  );
}

export const WifiDiagnosisCard = memo(WifiDiagnosisCardComponent);
