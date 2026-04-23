import { memo } from 'react';
import { Laptop } from 'lucide-react';

export interface ImpactedDevice {
  deviceId: string;
  type: string;
}

export interface DeviceImpactCardProps {
  count: string;
  devices: ImpactedDevice[];
}

function DeviceImpactCardComponent({ count, devices }: DeviceImpactCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <Laptop className="size-4 text-[var(--primary)]" />
        <span className="font-semibold text-foreground text-sm">Impacted Devices</span>
        <span className="ml-auto inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-200">
          {count} affected
        </span>
      </div>
      {devices.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {devices.map((d) => (
            <span
              key={d.deviceId}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300"
            >
              {d.deviceId}
              <span className="text-muted-foreground">({d.type})</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export const DeviceImpactCard = memo(DeviceImpactCardComponent);
