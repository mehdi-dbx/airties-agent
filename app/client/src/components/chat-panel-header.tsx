import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useRole } from '@/contexts/RoleContext';
import { useTableRefresh } from '@/contexts/TableRefreshContext';
import { Switch } from '@/components/ui/switch';
import {
  PlusIcon,
  HistoryIcon,
  Maximize2,
  Minimize2,
  X,
  RotateCcw,
  Bell,
} from 'lucide-react';
import { useTaskNotification } from '@/contexts/TaskNotificationContext';

export function ChatPanelHeader({
  showIntermediateSteps,
  onToggleIntermediateSteps,
  onNewChat,
  onHistory,
  expanded,
  onExpand,
  onClose,
  sendMessage,
}: {
  showIntermediateSteps: boolean;
  onToggleIntermediateSteps: () => void;
  onNewChat: () => void;
  onHistory: () => void;
  expanded: boolean;
  onExpand: () => void;
  onClose?: () => void;
  sendMessage?: (message: {
    role: 'user';
    parts: Array<{ type: 'text'; text: string }>;
    metadata?: { source?: string };
  }) => void;
}) {
  const { refresh } = useTableRefresh();
  const { role, setRole } = useRole();
  const { hasUnreadTask } = useTaskNotification();
  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;
  const [resetting, setResetting] = useState(false);

  // Send persona message to agent on mount and when user changes role
  useEffect(() => {
    const fn = sendMessageRef.current;
    if (!fn) return;
    const personaMessage =
      role === 'Agent'
        ? 'Your current persona is now Support Technician'
        : 'Your current persona is now Network Engineer';
    fn({
      role: 'user',
      parts: [{ type: 'text', text: personaMessage }],
      metadata: { source: 'system' },
    });
  }, [role]);

  const resetState = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/reset-state', { method: 'POST', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        refresh('network_health');
        refresh('mesh_nodes');
        refresh('client_devices');
        refresh('wifi_events');
        refresh('speed_tests');
      }
    } catch {
      // Reset failed - no UI feedback
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-4 py-2.5 min-h-[48px]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="truncate text-[14px] font-semibold text-foreground">
          AI Assistant
        </span>
        <div className="flex items-center gap-2">
          <select
            value={role}
            onChange={(e) => {
              const newRole = e.target.value as 'Agent' | 'Manager';
              if (newRole !== role) {
                onNewChat();
                setRole(newRole);
              }
            }}
            className="rounded-lg border border-input bg-secondary px-2.5 py-1 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            aria-label="Role"
          >
            <option value="Agent">Support Tech</option>
            <option value="Manager">Network Eng</option>
          </select>
          {role === 'Agent' && hasUnreadTask && (
            <span
              className="flex items-center justify-center rounded-full bg-[var(--primary)] p-1.5 text-white"
              title="New network alert"
            >
              <Bell className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
          onClick={resetState}
          disabled={resetting}
          aria-label="Reset state"
          title="Reset demo state"
        >
          <RotateCcw className={`h-4 w-4 ${resetting ? 'animate-spin' : ''}`} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
          onClick={onNewChat}
          aria-label="New chat"
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
          onClick={onHistory}
          aria-label="History"
        >
          <HistoryIcon className="h-4 w-4" />
        </Button>
        <Switch
          checked={showIntermediateSteps}
          onCheckedChange={onToggleIntermediateSteps}
          label="Steps"
          title="Show/hide tool steps"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
          onClick={onExpand}
          aria-label={expanded ? 'Tuck chat' : 'Expand chat'}
        >
          {expanded ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
        {onClose != null && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
}
