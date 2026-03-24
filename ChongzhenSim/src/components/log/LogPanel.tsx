import { useGameStore } from '../../store/gameStore';

export function LogPanel() {
  const turnLog = useGameStore(state => state.turnLog);

  return (
    <div className="palace-panel panel-decorated h-full p-4">
      <h2 className="palace-title text-lg mb-4 panel-title-decorated">朝政日志</h2>
      
      <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto palace-scrollbar">
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
