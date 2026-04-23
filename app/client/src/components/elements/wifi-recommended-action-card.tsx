import { memo } from 'react';
import { Lightbulb } from 'lucide-react';

export interface WifiRecommendedActionCardProps {
  items: string[];
}

function WifiRecommendedActionCardComponent({ items }: WifiRecommendedActionCardProps) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-sm dark:border-emerald-800/40 dark:bg-emerald-900/20">
      <div className="mb-2 flex items-center gap-2">
        <Lightbulb className="size-4 text-emerald-600 dark:text-emerald-400" />
        <span className="font-semibold text-emerald-800 text-sm dark:text-emerald-200">Recommended Actions</span>
      </div>
      <ol className="flex flex-col gap-1 text-xs text-emerald-700 dark:text-emerald-300">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="mt-0.5 font-medium">{i + 1}.</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export const WifiRecommendedActionCard = memo(WifiRecommendedActionCardComponent);
