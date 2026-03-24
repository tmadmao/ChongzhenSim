import { useGameStore } from '../../store/gameStore';
import { useFinanceStore } from '../../store/financeStore';

const defaultNationStats = {
  militaryPower: 50,
  peopleMorale: 50,
  borderThreat: 40,
  overallCorruption: 35,
  agriculturalOutput: 60
};

export function StatusBar() {
  const { gameState } = useGameStore();
  const { treasury, financialHealth } = useFinanceStore();

  if (!gameState) return null;

  const nationStats = gameState.nationStats || defaultNationStats;

  const getHealthColor = () => {
    switch (financialHealth) {
      case 'surplus': return 'text-success';
      case 'balanced': return 'text-warning';
      case 'deficit': return 'text-orange-400';
      case 'bankrupt': return 'text-danger';
      default: return 'text-palace-text';
    }
  };

  const getHealthLabel = () => {
    switch (financialHealth) {
      case 'surplus': return '盈余';
      case 'balanced': return '平衡';
      case 'deficit': return '赤字';
      case 'bankrupt': return '破产';
      default: return '未知';
    }
  };

  const getPhaseIcon = () => {
    switch (gameState.phase) {
      case 'morning': return '🌅';
      case 'afternoon': return '☀️';
      case 'night': return '🌙';
      default: return '🌅';
    }
  };

  const getPhaseName = () => {
    switch (gameState.phase) {
      case 'morning': return '早朝';
      case 'afternoon': return '午朝';
      case 'night': return '夜议';
      default: return '早朝';
    }
  };

  const getGoldColor = () => {
    if (treasury.gold > 10000) return 'text-success';
    if (treasury.gold > 5000) return 'text-palace-gold';
    return 'text-danger';
  };

  return (
    <div className="palace-panel panel-decorated h-full flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <div>
          <h1 className="palace-title text-xl panel-title-decorated">{gameState.date || '崇祯元年正月'}</h1>
          <p className="text-palace-text-muted text-sm">
            第 {gameState.turn || 1} 回合 · {getPhaseIcon()} {getPhaseName()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="status-item">
          <p className="text-palace-text-muted text-xs mb-1">国库银两</p>
          <p className={`palace-number text-lg ${getGoldColor()}`}>
            {Math.floor(treasury.gold).toLocaleString()}
          </p>
        </div>

        <div className="status-item">
          <p className="text-palace-text-muted text-xs mb-1">粮仓储备</p>
          <p className="palace-number text-lg">
            {treasury.grain.toLocaleString()}
          </p>
        </div>

        <div className="status-item">
          <p className="text-palace-text-muted text-xs mb-1">财政状况</p>
          <p className={`palace-number text-lg ${getHealthColor()}`}>
            {getHealthLabel()}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="status-item">
            <p className="text-palace-text-muted text-xs mb-1">军力</p>
            <div className="w-20">
              <div className="palace-progress h-1.5 progress-glow">
                <div 
                  className="palace-progress-bar palace-progress-info"
                  style={{ width: `${nationStats.militaryPower}%` }}
                />
              </div>
              <p className="text-xs text-palace-text-muted mt-1 text-center">
                {nationStats.militaryPower}
              </p>
            </div>
          </div>

          <div className="status-item">
            <p className="text-palace-text-muted text-xs mb-1">民心</p>
            <div className="w-20">
              <div className="palace-progress h-1.5 progress-glow">
                <div 
                  className="palace-progress-bar palace-progress-success"
                  style={{ width: `${nationStats.peopleMorale}%` }}
                />
              </div>
              <p className="text-xs text-palace-text-muted mt-1 text-center">
                {nationStats.peopleMorale}
              </p>
            </div>
          </div>

          <div className="status-item">
            <p className="text-palace-text-muted text-xs mb-1">边患</p>
            <div className="w-20">
              <div className="palace-progress h-1.5 progress-glow">
                <div 
                  className={`palace-progress-bar ${nationStats.borderThreat > 70 ? 'palace-progress-danger' : 'palace-progress-warning'}`}
                  style={{ width: `${nationStats.borderThreat}%` }}
                />
              </div>
              <p className="text-xs text-palace-text-muted mt-1 text-center">
                {nationStats.borderThreat}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
