import type { ReactNode } from 'react';
import { useThemeStore } from '../../store/themeStore';

interface LayoutProps {
  children: ReactNode;
  statusBar: ReactNode;
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  bottomBar: ReactNode;
}

export function Layout({ children, statusBar, leftPanel, rightPanel, bottomBar }: LayoutProps) {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="min-h-screen flex flex-col bg-palace-bg">
      <header className="h-16 flex-shrink-0">
        {statusBar}
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-80 flex-shrink-0 overflow-y-auto palace-scrollbar">
          {leftPanel}
        </aside>

        <section className="flex-1 overflow-hidden">
          {children}
        </section>

        <aside className="w-72 flex-shrink-0 overflow-y-auto palace-scrollbar">
          {rightPanel}
        </aside>
      </main>

      <footer className="h-20 flex-shrink-0">
        {bottomBar}
      </footer>

      <button
        onClick={toggleTheme}
        className="fixed bottom-24 right-4 w-10 h-10 rounded-full palace-button-outline flex items-center justify-center text-lg"
        title={theme === 'dark' ? '切换到白色简约' : '切换到华贵暗金'}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  );
}
