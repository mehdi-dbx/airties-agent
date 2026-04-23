import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTableRefresh } from '@/contexts/TableRefreshContext';
import { useTableData, getRowKey } from '@/hooks/useTableData';
import { MetricsOverview } from '@/components/MetricsOverview';

const TIMESTAMP_COLUMNS = ['recorded_at', 'last_checked', 'last_seen', 'event_timestamp', 'test_time'];

const TABLE_PASTELS: Record<string, string> = {
  mesh_nodes: 'bg-blue-100 dark:bg-blue-900/30',
  client_devices: 'bg-sky-100 dark:bg-sky-900/30',
  wifi_events: 'bg-indigo-100 dark:bg-indigo-900/30',
  speed_tests: 'bg-cyan-100 dark:bg-cyan-900/30',
};

function displayName(name: string): string {
  return name.replace(/_/g, ' ');
}

function signalStrengthCellClass(value: unknown): string {
  const n = Number(value);
  if (Number.isNaN(n)) return '';
  if (n <= -80) return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 font-medium';
  if (n >= -50) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
  return '';
}

function statusCapsuleClass(value: string): string {
  const v = value.toLowerCase();
  if (v === 'online' || v === 'connected' || v === 'good' || v === 'operational') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
  if (v === 'offline' || v === 'disconnected' || v === 'critical' || v === 'error') return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200';
  if (v === 'degraded' || v === 'warning' || v === 'weak') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
  if (v === 'idle' || v === 'standby') return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
}

function eventTypeCapsuleClass(value: string): string {
  const v = (value ?? '').toLowerCase();
  if (v === 'interference') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
  if (v === 'disconnect' || v === 'failure') return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200';
  if (v === 'roaming' || v === 'band_switch') return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200';
  if (v === 'resolved') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
}

function formatCell(cell: unknown, columnName: string): string {
  if (cell == null) return '—';
  const s = String(cell);
  const col = columnName.toLowerCase();
  if (col === 'status' || col === 'connection_status' || col === 'health' || col === 'event_type') return s.toLowerCase();
  const isTimestampColumn = TIMESTAMP_COLUMNS.some((c) =>
    columnName.toLowerCase().includes(c.toLowerCase()),
  );
  const looksLikeTimestamp =
    /^\d{4}-\d{2}-\d{2}(T|\s)\d{2}:\d{2}/.test(s) || /^\d{4}-\d{2}-\d{2}$/.test(s);
  if ((isTimestampColumn || looksLikeTimestamp) && s) {
    try {
      const d = new Date(s);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }).replace(/,/g, '');
      }
    } catch {
      /* fall through */
    }
  }
  return s;
}

function TableCard({ title, tableName, compact, id }: { title: string; tableName: string; compact?: boolean; id?: string }) {
  const { refreshKeys, refresh } = useTableRefresh();
  const refreshTrigger = refreshKeys[tableName] ?? 0;
  const { data, loading, error, changedRowKeys, setChangedRowKeys } = useTableData(tableName, refreshTrigger);

  useEffect(() => {
    if (changedRowKeys.size > 0) {
      const t = setTimeout(() => setChangedRowKeys(new Set()), 2000);
      return () => clearTimeout(t);
    }
  }, [changedRowKeys.size, setChangedRowKeys]);

  return (
    <div id={id} className="rounded-xl border border-border bg-card shadow-sm">
      <div
        className={[
          'flex items-center justify-between border-b border-border px-3 py-1.5',
          TABLE_PASTELS[tableName] ?? 'bg-muted',
        ].join(' ')}
      >
        <h2 className="font-bold text-foreground text-sm">{displayName(title)}</h2>
        <button
          type="button"
          onClick={() => refresh(tableName)}
          disabled={loading}
          aria-label="Refresh"
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw
            className={`size-3.5 ${loading ? 'animate-spin' : ''}`}
          />
        </button>
      </div>
      <div className="overflow-x-auto p-[10px]">
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
        {!data && loading && (
          <p className="text-xs text-muted-foreground">Loading...</p>
        )}
        {data && (
          <table className={`w-full border-collapse text-xs ${compact ? 'min-w-[200px]' : 'min-w-[360px]'}`}>
            <thead>
              <tr>
                {data.columns.map((col) => (
                  <th
                    key={col}
                    className="border-b border-border px-2.5 py-1.5 text-left font-medium text-foreground"
                  >
                    {displayName(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={data.columns.length}
                    className="px-2.5 py-2 text-center text-muted-foreground"
                  >
                    No rows
                  </td>
                </tr>
              ) : (
                data.rows.map((row, i) => {
                  const rowKey = getRowKey(row, data.columns, tableName);
                  const isChanged = changedRowKeys.has(rowKey);
                  return (
                  <tr
                    key={i}
                    className={[
                      'border-b border-border/50',
                      isChanged ? 'animate-row-flash' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    {row.map((cell, j) => {
                      const col = data.columns[j] ?? '';
                      const colLower = col.toLowerCase();
                      const display = formatCell(cell, col);
                      const isId = colLower === 'node_id' || colLower === 'device_id' || colLower === 'mac_address' || colLower === 'test_id';
                      const isStatus = colLower === 'status' || colLower === 'connection_status' || colLower === 'health';
                      const isEventType = colLower === 'event_type';
                      const isCapsule = isId || isStatus || isEventType;
                      const isSignal = colLower === 'signal_strength' || colLower === 'rssi';
                      const signalClass = isSignal ? signalStrengthCellClass(cell) : '';
                      return (
                        <td
                          key={j}
                          className="px-2.5 py-1.5 text-muted-foreground"
                        >
                          {isCapsule ? (
                            <span
                              className={[
                                'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                                isId
                                  ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                  : isEventType
                                    ? eventTypeCapsuleClass(display)
                                    : statusCapsuleClass(display),
                              ].join(' ')}
                            >
                              {display}
                            </span>
                          ) : isSignal && signalClass ? (
                            <span className={['inline-flex rounded-full px-2 py-0.5 text-xs font-medium', signalClass].join(' ')}>
                              {display}
                            </span>
                          ) : (
                            display
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-auto px-4 py-3">
      <h1 className="mb-2 font-medium text-foreground text-sm">Dashboard</h1>
      <div className="flex flex-col gap-3">
        <TableCard title="mesh_nodes" tableName="mesh_nodes" />
        <div className="grid min-w-0 grid-cols-2 gap-3">
          <div className="row-span-2 min-w-0">
            <TableCard id="client-devices-table" title="client_devices" tableName="client_devices" compact />
          </div>
          <div className="min-w-0">
            <TableCard title="wifi_events" tableName="wifi_events" compact />
          </div>
          <div className="min-w-0">
            <TableCard title="speed_tests" tableName="speed_tests" compact />
          </div>
        </div>
        <MetricsOverview />
      </div>
    </div>
  );
}
