import { useGameStore } from '../../store/gameStore';

interface LogPanelProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function LogPanel({ isCollapsed = false, onToggle }: LogPanelProps) {
  const turnLog = useGameStore(state => state.turnLog);

  // 收缩状态下只显示一个小横条
  if (isCollapsed) {
    return (
      <div 
        className="h-full w-full bg-palace-bg-light/50 border-t border-palace-border cursor-pointer hover:bg-palace-bg-light transition-colors flex items-center justify-between px-4"
        onClick={onToggle}
        title="点击展开朝政日志"
      >
        <span className="palace-title text-xs">朝政日志</span>
        <span className="text-palace-text-muted">▼</span>
      </div>
    );
  }

  return (
    <div className="palace-panel panel-decorated h-full p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="palace-title text-lg panel-title-decorated">朝政日志</h2>
        {onToggle && (
          <button
            onClick={onToggle}
            className="text-palace-text-muted hover:text-palace-gold transition-colors"
            title="收缩"
          >
            ▲
          </button>
        )}
      </div>
      
      <div className="space-y-2 flex-1 overflow-y-auto palace-scrollbar min-h-0">
        {turnLog.length === 0 ? (
          <p className="text-palace-text-muted text-sm text-center py-8">
            暂无日志记录
          </p>
        ) : (
          turnLog.slice(-50).reverse().map((log, i) => (
            <div 
              key={i} 
              className="text-palace-text-muted border-l-2 border-palace-gold/50 pl-3 py-2 text-sm animate-slide-in bg-palace-bg-light/30 rounded-r"
              style={{ animationDelay: `${i * 0.02}s` }}
            >
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
