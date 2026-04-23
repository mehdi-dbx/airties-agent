import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar';
import {
  MessageSquare,
  LayoutDashboard,
  Network,
  FileText,
  BarChart3,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import type { ClientSession } from '@chat-template/auth';
import AirtiesLogo from '@/assets/airties-logo.png';

const navItems = [
  { to: '/', icon: MessageSquare, label: 'AI Assistant' },
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Network, label: 'Network' },
  { icon: FileText, label: 'Documents' },
  { icon: BarChart3, label: 'Analytics' },
] as const;

export function AppSidebar({
  user,
  preferredUsername: _preferredUsername,
}: {
  user: ClientSession['user'] | undefined;
  preferredUsername: string | null;
}) {
  const location = useLocation();
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const displayName =
    user?.preferredUsername || user?.name || user?.email || 'User';
  const initials = displayName
    .split(/\s+/)
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Sidebar
      className="group-data-[side=left]:border-r border-sidebar-border bg-sidebar"
      collapsible="icon"
    >
      {/* Logo header */}
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-3">
        {!isCollapsed && (
          <img src={AirtiesLogo} alt="Airties" className="h-8" />
        )}
        {isCollapsed && (
          <div className="flex w-full items-center justify-center">
            <span className="text-sm font-bold text-[var(--primary)]">A</span>
          </div>
        )}
      </div>

      <SidebarContent className="gap-0 px-2 pt-3">
        <SidebarMenu>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isHome = item.to === '/';
            const isActive =
              isHome &&
              (location.pathname === '/' ||
                location.pathname.startsWith('/chat'));
            return (
              <SidebarMenuItem key={item.label}>
                {isHome ? (
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.label}
                  >
                    <a
                      href="/"
                      className={`flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-[13px] transition-colors duration-150 ${
                        isActive
                          ? 'border-l-[3px] border-[var(--primary)] bg-accent font-semibold text-[var(--primary)]'
                          : 'border-l-[3px] border-transparent text-sidebar-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-[var(--primary)]' : ''}`} />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton
                    tooltip={item.label}
                    className="cursor-default border-l-[3px] border-transparent px-2.5 py-2.5 text-[13px] opacity-50"
                    disabled
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-sidebar-border p-2">
        {/* User avatar row */}
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sidebar-foreground">
          <div className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-accent text-[12px] font-bold text-[var(--primary)]">
            {initials}
          </div>
          {!isCollapsed && (
            <span className="truncate text-[13px] font-semibold text-foreground">
              {displayName}
            </span>
          )}
        </div>
        <SidebarMenuButton
          onClick={toggleSidebar}
          tooltip={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-full text-sidebar-foreground hover:bg-accent hover:text-foreground"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
          <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
