import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  statusBar: ReactNode;
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  rightPanelCollapsed?: boolean;
  onToggleRightPanel?: () => void;
  bottomBar: ReactNode;
}

export function Layout({ 
  children, 
  statusBar, 
  leftPanel, 
  rightPanel, 
  rightPanelCollapsed = false, 
  onToggleRightPanel,
  bottomBar 
}: LayoutProps) {
  return (
    <div className="h-screen max-h-screen flex flex-col bg-palace-bg overflow-hidden">
      <header className="h-16 flex-shrink-0">
        {statusBar}
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-80 flex-shrink-0 overflow-y-auto palace-scrollbar">
          {leftPanel}
        </aside>

        <section className="flex-1 overflow-hidden relative">
          {children}
          
          {/* 右侧面板切换按钮 - 放在更显眼的位置 */}
          {onToggleRightPanel && (
            <button
              onClick={onToggleRightPanel}
              className="absolute top-4 right-4 z-50 w-12 h-12 rounded-full palace-button-gold flex items-center justify-center text-xl shadow-xl hover:scale-110 transition-transform border-2 border-palace-gold"
              title={rightPanelCollapsed ? '展开右侧面板' : '收起右侧面板'}
            >
              {rightPanelCollapsed ? '📋' : '✕'}
            </button>
          )}
        </section>

        {/* 右侧面板 - 支持收缩/展开 */}
        <aside 
          className={`flex-shrink-0 overflow-y-auto palace-scrollbar transition-all duration-300 ${
            rightPanelCollapsed ? 'w-0 overflow-hidden' : 'w-72'
          }`}
        >
          {rightPanel}
        </aside>
      </main>

      <footer className="h-20 flex-shrink-0">
        {bottomBar}
      </footer>
    </div>
  );
}
