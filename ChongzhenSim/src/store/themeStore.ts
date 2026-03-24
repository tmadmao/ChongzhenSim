import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light';

interface ThemeStore {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      
      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        document.documentElement.className = newTheme === 'light' ? 'theme-light' : '';
        set({ theme: newTheme });
      },
      
      setTheme: (theme) => {
        document.documentElement.className = theme === 'light' ? 'theme-light' : '';
        set({ theme });
      }
    }),
    {
      name: 'chongzhensim-theme'
    }
  )
);

export function initTheme(): void {
  const savedTheme = localStorage.getItem('chongzhensim-theme');
  if (savedTheme) {
    try {
      const parsed = JSON.parse(savedTheme);
      const theme = parsed.state?.theme;
      if (theme === 'light') {
        document.documentElement.className = 'theme-light';
      }
    } catch {
      // ignore
    }
  }
}
