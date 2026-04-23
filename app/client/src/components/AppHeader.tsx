import { SidebarToggle } from '@/components/sidebar-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSession } from '@/contexts/SessionContext';
import { useTheme } from 'next-themes';
import AirtiesLogo from '@/assets/airties-logo.png';

export function AppHeader() {
  const { session, loading } = useSession();
  const { setTheme, resolvedTheme } = useTheme();

  const displayName =
    session?.user?.preferredUsername ||
    session?.user?.name ||
    session?.user?.email ||
    'User';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        <SidebarToggle />
        <span className="font-semibold tracking-tight text-foreground text-base">
        </span>
      </div>
      <div className="flex flex-1 items-center justify-center px-4">
        <img src={AirtiesLogo} alt="Airties Veron" className="h-20" />
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex size-[30px] items-center justify-center rounded-full bg-accent text-[12px] font-bold text-[var(--primary)] hover:bg-accent/80 transition-colors"
              data-testid="header-user-avatar"
            >
              {loading ? (
                <span className="animate-pulse">?</span>
              ) : (
                initials
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            align="end"
            className="w-48 rounded-xl"
          >
            <DropdownMenuItem
              className="cursor-pointer text-[13px]"
              onSelect={() =>
                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
              }
            >
              {`Toggle ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
