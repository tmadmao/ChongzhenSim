import { create } from 'zustand';

export type NavigationView = 'map' | 'officials' | 'policy' | 'military' | 'court' | 'debug';

interface NavigationStore {
  currentView: NavigationView;
  setView: (view: NavigationView) => void;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  currentView: 'court',
  setView: (view) => set({ currentView: view }),
}));
