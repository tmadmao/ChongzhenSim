import { useState } from 'react';
import { Settings } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

interface BottomBarProps {
  onOpenMinisterChat: () => void;
  onOpenDecree: () => void;
  onOpenSettings: () => void;
}

export function BottomBar({ onOpenMinisterChat, onOpenDecree, onOpenSettings }: BottomBarProps) {
  const { endTurn, isLoading } = useGameStore();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleEndTurn = async () => {
    if (showConfirm) {
      await endTurn();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
      setTimeout(() => setShowConfirm(false), 3000);
    }
  };

  return (
    <div className="palace-panel panel-decorated h-full flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={onOpenMinisterChat}
          className="palace-button btn-glow flex items-center gap-2"
        >
          <span>💬</span>
          <span>召见大臣</span>
        </button>

        <button 
          onClick={onOpenDecree}
          className="palace-button btn-glow flex items-center gap-2"
        >
          <span>📜</span>
          <span>发布诏书</span>
        </button>


      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={onOpenSettings}
          className="palace-button-outline btn-glow text-sm flex items-center gap-2"
        >
          <Settings size={16} />
          设置
        </button>

        <button 
          onClick={handleEndTurn}
          disabled={isLoading}
          className={`px-8 py-3 rounded-lg font-semibold transition-all ${
            showConfirm 
              ? 'bg-danger text-white animate-pulse' 
              : 'palace-button-gold btn-glow'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              处理中...
            </span>
          ) : showConfirm ? (
            '⚠️ 确认结束回合？'
          ) : (
            '结束回合'
          )}
        </button>
      </div>
    </div>
  );
}
