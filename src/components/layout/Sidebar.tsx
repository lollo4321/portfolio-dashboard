import { type ComponentType } from 'react';
import { LayoutDashboard, ArrowLeftRight, Upload } from 'lucide-react';
import { useUIStore, type ActivePage } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

type NavItem = {
  id: ActivePage;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'import', label: 'Import CSV', icon: Upload },
];

export function Sidebar() {
  const { activePage, setActivePage } = useUIStore();

  return (
    <aside className="w-56 min-h-screen bg-card border-r border-border flex flex-col shrink-0">
      {/* Brand header */}
      <div className="p-5 border-b border-border">
        <p className="font-bold text-base text-foreground">Portfolio</p>
        <p className="text-xs text-muted-foreground mt-0.5">Personal Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActivePage(id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              activePage === id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
