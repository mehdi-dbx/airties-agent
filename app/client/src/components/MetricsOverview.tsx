import { useTableData } from '@/hooks/useTableData';
import { useTableRefresh } from '@/contexts/TableRefreshContext';

type CapsuleColor = 'amber' | 'blue';

function roomCapsuleColor(room: string): CapsuleColor {
  const lower = room.toLowerCase();
  if (lower.includes('living') || lower.includes('office')) return 'blue';
  return 'amber';
}

function signalColor(dbm: number): 'green' | 'amber' | 'red' {
  if (dbm >= -50) return 'green';
  if (dbm >= -70) return 'amber';
  return 'red';
}

function getColIndex(columns: string[], name: string): number {
  const lower = name.toLowerCase();
  return columns.findIndex((c) => c.toLowerCase() === lower);
}

function getCell(row: unknown[], colIndex: number): unknown {
  return colIndex >= 0 ? row[colIndex] : undefined;
}

const CAPSULE_CLASSES: Record<CapsuleColor, string> = {
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
};

function RoomValueCard({
  room,
  value,
  label,
  color,
  arcPercent,
  capsuleColor,
}: {
  room: string;
  value: string;
  label: string;
  color: 'green' | 'amber' | 'red' | 'teal';
  arcPercent: number;
  capsuleColor: CapsuleColor;
}) {
  const colorClasses = {
    green: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
    teal: 'text-teal-600 dark:text-teal-400',
  };
  const strokeClasses = {
    green: 'stroke-emerald-500 dark:stroke-emerald-400',
    amber: 'stroke-amber-500 dark:stroke-amber-400',
    red: 'stroke-red-500 dark:stroke-red-400',
    teal: 'stroke-teal-500 dark:stroke-teal-400',
  };
  const size = 86;
  const strokeWidth = 7;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (arcPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
      <span className={`mb-1 inline-flex rounded-full px-2 py-0.5 font-medium text-xs ${CAPSULE_CLASSES[capsuleColor]}`}>
        {room}
      </span>
      <span className="mb-1.5 font-semibold text-muted-foreground text-xs">{label}</span>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-border"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className={strokeClasses[color]}
          />
        </svg>
        <div
          className="absolute left-0 top-0 flex h-full w-full items-center justify-center"
          style={{ width: size, height: size }}
        >
          <span className={`whitespace-nowrap font-bold text-base leading-none ${colorClasses[color]}`}>{value}</span>
        </div>
      </div>
    </div>
  );
}

function RoomMetricCard({
  room,
  count,
  total,
  label,
  color,
  capsuleColor,
}: {
  room: string;
  count: number;
  total: number;
  label: string;
  color: 'green' | 'amber' | 'red' | 'teal';
  capsuleColor: CapsuleColor;
}) {
  const colorClasses = {
    green: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
    teal: 'text-teal-600 dark:text-teal-400',
  };
  const strokeClasses = {
    green: 'stroke-emerald-500 dark:stroke-emerald-400',
    amber: 'stroke-amber-500 dark:stroke-amber-400',
    red: 'stroke-red-500 dark:stroke-red-400',
    teal: 'stroke-teal-500 dark:stroke-teal-400',
  };
  const size = 86;
  const strokeWidth = 7;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const arcPercent = total > 0 ? Math.min(100, (count / total) * 100) : 0;
  const dashOffset = circumference - (arcPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
      <span className={`mb-1 inline-flex rounded-full px-2 py-0.5 font-medium text-xs ${CAPSULE_CLASSES[capsuleColor]}`}>
        {room}
      </span>
      <span className="mb-1.5 font-semibold text-muted-foreground text-xs">{label}</span>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-border"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className={strokeClasses[color]}
          />
        </svg>
        <div
          className="absolute left-0 top-0 flex h-full w-full items-center justify-center"
          style={{ width: size, height: size }}
        >
          <span className={`whitespace-nowrap font-bold text-base leading-none ${colorClasses[color]}`}>
            {total > 0 ? `${count}/${total}` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

export function MetricsOverview() {
  const { refreshKeys } = useTableRefresh();
  const healthData = useTableData('network_health', refreshKeys['network_health'] ?? 0);
  const nodesData = useTableData('mesh_nodes', refreshKeys['mesh_nodes'] ?? 0);
  const devicesData = useTableData('client_devices', refreshKeys['client_devices'] ?? 0);

  const loading = healthData.loading || nodesData.loading || devicesData.loading;

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card px-3 py-3 shadow-sm">
        <h2 className="mb-2 font-medium text-foreground text-xs">Network Overview</h2>
        <p className="text-muted-foreground text-sm">Loading metrics...</p>
      </div>
    );
  }

  const nodesCols = nodesData.data?.columns ?? [];
  const devicesCols = devicesData.data?.columns ?? [];

  const nodeRoomIdx = getColIndex(nodesCols, 'location');
  const nodeStatusIdx = getColIndex(nodesCols, 'status');
  const nodeSignalIdx = getColIndex(nodesCols, 'signal_strength');

  const deviceRoomIdx = getColIndex(devicesCols, 'location');
  const deviceStatusIdx = getColIndex(devicesCols, 'connection_status');

  const allRooms = new Set<string>();
  for (const row of nodesData.data?.rows ?? []) {
    const r = String(getCell(row as unknown[], nodeRoomIdx)).trim();
    if (r && r !== 'undefined') allRooms.add(r);
  }
  for (const row of devicesData.data?.rows ?? []) {
    const r = String(getCell(row as unknown[], deviceRoomIdx)).trim();
    if (r && r !== 'undefined') allRooms.add(r);
  }
  const rooms = [...allRooms].sort();

  // Signal strength by room (from nodes)
  const signalByRoom: Record<string, number> = {};
  for (const r of rooms) signalByRoom[r] = 0;
  for (const row of nodesData.data?.rows ?? []) {
    const r = String(getCell(row as unknown[], nodeRoomIdx)).trim();
    const v = Number(getCell(row as unknown[], nodeSignalIdx));
    if (r && !Number.isNaN(v)) signalByRoom[r] = v;
  }

  // Nodes online/total by room
  const nodesOnlineByRoom: Record<string, number> = {};
  const nodesTotalByRoom: Record<string, number> = {};
  for (const r of rooms) { nodesOnlineByRoom[r] = 0; nodesTotalByRoom[r] = 0; }
  for (const row of nodesData.data?.rows ?? []) {
    const r = String(getCell(row as unknown[], nodeRoomIdx)).trim();
    const status = String(getCell(row as unknown[], nodeStatusIdx)).toLowerCase();
    if (!r) continue;
    nodesTotalByRoom[r] = (nodesTotalByRoom[r] ?? 0) + 1;
    if (status === 'online' || status === 'connected') {
      nodesOnlineByRoom[r] = (nodesOnlineByRoom[r] ?? 0) + 1;
    }
  }

  // Devices connected/total by room
  const devConnByRoom: Record<string, number> = {};
  const devTotalByRoom: Record<string, number> = {};
  for (const r of rooms) { devConnByRoom[r] = 0; devTotalByRoom[r] = 0; }
  for (const row of devicesData.data?.rows ?? []) {
    const r = String(getCell(row as unknown[], deviceRoomIdx)).trim();
    const status = String(getCell(row as unknown[], deviceStatusIdx)).toLowerCase();
    if (!r) continue;
    devTotalByRoom[r] = (devTotalByRoom[r] ?? 0) + 1;
    if (status === 'connected' || status === 'online') {
      devConnByRoom[r] = (devConnByRoom[r] ?? 0) + 1;
    }
  }

  return (
    <div className="min-w-0 rounded-xl border border-border bg-card px-3 py-2 shadow-sm">
      <h2 className="mb-2 font-medium text-foreground text-xs">Network Overview</h2>
      <div className="flex min-w-0 flex-nowrap gap-5 overflow-x-auto">
        {rooms.map((room) => {
          const capColor = roomCapsuleColor(room);
          const dbm = signalByRoom[room] ?? -100;
          const sigColor = signalColor(dbm);
          // Normalize signal: -100 = 0%, -30 = 100%
          const arcPercent = Math.min(100, Math.max(0, ((dbm + 100) / 70) * 100));
          return (
            <div
              key={room}
              className="flex shrink-0 flex-wrap gap-3 rounded-xl border border-border p-2"
            >
              <RoomValueCard
                room={room}
                value={dbm > -100 ? `${dbm} dBm` : '—'}
                label="Signal strength"
                color={sigColor}
                arcPercent={arcPercent}
                capsuleColor={capColor}
              />
              <RoomMetricCard
                room={room}
                count={nodesOnlineByRoom[room] ?? 0}
                total={nodesTotalByRoom[room] ?? 0}
                label="Nodes online"
                color="green"
                capsuleColor={capColor}
              />
              <RoomMetricCard
                room={room}
                count={devConnByRoom[room] ?? 0}
                total={devTotalByRoom[room] ?? 0}
                label="Devices connected"
                color="teal"
                capsuleColor={capColor}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
