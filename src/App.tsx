import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/pages/Dashboard';
import { Transactions } from '@/pages/Transactions';
import { Import } from '@/pages/Import';
import { useUIStore } from '@/stores/uiStore';

// Simple in-app routing via Zustand uiStore.
// We're not using react-router-dom yet because all navigation is single-page
// with no URL requirements at this stage. Easy to add later without changing
// the component tree significantly.
function App() {
  const activePage = useUIStore((s) => s.activePage);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {activePage === 'dashboard' && <Dashboard />}
        {activePage === 'transactions' && <Transactions />}
        {activePage === 'import' && <Import />}
      </main>
    </div>
  );
}

export default App;
