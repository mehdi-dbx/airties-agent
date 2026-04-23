import { memo } from 'react';
import { AlertTriangle } from 'lucide-react';

export interface WifiConsequencesCardProps {
  items: string[];
}

function WifiConsequencesCardComponent({ items }: WifiConsequencesCardProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 shadow-sm dark:border-amber-800/40 dark:bg-amber-900/20">
      <div className="mb-2 flex items-center gap-2">
        <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
        <span className="font-semibold text-amber-800 text-sm dark:text-amber-200">Potential Consequences</span>
      </div>
      <ul className="flex flex-col gap-1 text-xs text-amber-700 dark:text-amber-300">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const WifiConsequencesCard = memo(WifiConsequencesCardComponent);
