import { create } from 'zustand';

export type ActivePage = 'dashboard' | 'transactions' | 'import';

interface UIState {
  activePage: ActivePage;
  isSidebarCollapsed: boolean;
  setActivePage: (page: ActivePage) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  activePage: 'dashboard',
  isSidebarCollapsed: false,
  setActivePage: (activePage) => set({ activePage }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}));
