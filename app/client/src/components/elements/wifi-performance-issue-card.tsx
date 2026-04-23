import { memo } from 'react';
import { TrendingDown } from 'lucide-react';

export interface WifiPerformanceIssueCardProps {
  location: string;
  metric: string;
  pctChange: string;
  windowMins: string;
  currentValue?: string;
  baseline?: string;
  timestamp?: string;
}

function WifiPerformanceIssueCardComponent({
  location,
  metric,
  pctChange,
  windowMins,
  currentValue,
  baseline,
  timestamp,
}: WifiPerformanceIssueCardProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-3 shadow-sm dark:border-red-800/40 dark:bg-red-900/20">
      <div className="mb-2 flex items-center gap-2">
        <TrendingDown className="size-4 text-red-600 dark:text-red-400" />
        <span className="font-semibold text-red-800 text-sm dark:text-red-200">Performance Degradation — {location}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="text-red-700 dark:text-red-300">
          <span className="font-medium">Metric:</span> {metric}
        </div>
        <div className="text-red-700 dark:text-red-300">
          <span className="font-medium">Change:</span> {pctChange}%
        </div>
        <div className="text-red-700 dark:text-red-300">
          <span className="font-medium">Window:</span> {windowMins} min
        </div>
        {currentValue && (
          <div className="text-red-700 dark:text-red-300">
            <span className="font-medium">Current:</span> {currentValue}
          </div>
        )}
        {baseline && (
          <div className="text-red-700 dark:text-red-300">
            <span className="font-medium">Baseline:</span> {baseline}
          </div>
        )}
        {timestamp && (
          <div className="col-span-2 text-red-700 dark:text-red-300">
            <span className="font-medium">Detected:</span> {timestamp}
          </div>
        )}
      </div>
    </div>
  );
}

export const WifiPerformanceIssueCard = memo(WifiPerformanceIssueCardComponent);
