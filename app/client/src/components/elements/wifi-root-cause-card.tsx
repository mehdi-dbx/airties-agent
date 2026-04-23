import { memo } from 'react';
import { SearchCheck } from 'lucide-react';

export interface WifiRootCauseCardProps {
  location: string;
  items: string[];
}

function formatItem(text: string): JSX.Element {
  const boldPatterns = ['Channel interference', 'Firmware', 'Signal loss', 'Band steering', 'DNS', 'DHCP', 'Packet loss', 'Latency'];
  for (const p of boldPatterns) {
    if (text.toLowerCase().startsWith(p.toLowerCase())) {
      return <><strong className="text-foreground">{text.slice(0, p.length)}</strong>{text.slice(p.length)}</>;
    }
  }
  const colonIdx = text.indexOf(':');
  if (colonIdx > 0 && colonIdx < 40) {
    return <><strong className="text-foreground">{text.slice(0, colonIdx)}</strong>{text.slice(colonIdx)}</>;
  }
  return <>{text}</>;
}

function WifiRootCauseCardComponent({ location, items }: WifiRootCauseCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <SearchCheck className="size-4 text-[var(--primary)]" />
        <span className="font-semibold text-foreground text-sm">Root Cause Analysis — {location}</span>
      </div>
      <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="mt-0.5 text-[var(--primary)]">•</span>
            <span>{formatItem(item)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const WifiRootCauseCard = memo(WifiRootCauseCardComponent);
