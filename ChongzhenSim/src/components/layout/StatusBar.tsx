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

  // 解析日期，添加天数
  const parseDateWithDay = (dateStr: string, turn: number) => {
    const match = dateStr.match(/崇祯(\d+)年(\d+)/);
    if (match) {
      const year = match[1];
      const monthNum = parseInt(match[2], 10);
      
      // 数字月份到名称的映射
      const monthMap: Record<number, string> = {
        1: '正月',
        2: '二月',
        3: '三月',
        4: '四月',
        5: '五月',
        6: '六月',
        7: '七月',
        8: '八月',
        9: '九月',
        10: '十月',
        11: '十一月',
        12: '腊月'
      };
      
      const month = monthMap[monthNum] || '正月';
      
      // 根据月份计算天数
      let daysInMonth = 30; // 默认30天
      if (monthNum === 2) {
        daysInMonth = 28; // 二月28天
      } else if ([4, 6, 9, 11].includes(monthNum)) {
        daysInMonth = 30; // 小月30天
      } else {
        daysInMonth = 31; // 大月31天
      }
      
      // 根据回合数计算天数
      const day = ((turn - 1) % daysInMonth) + 1;
      
      // 生成天数文本（初一、初二...）
      const dayText = day === 1 ? '初一' : 
                     day === 2 ? '初二' : 
                     day === 3 ? '初三' : 
                     day === 4 ? '初四' : 
                     day === 5 ? '初五' : 
                     day === 6 ? '初六' : 
                     day === 7 ? '初七' : 
                     day === 8 ? '初八' : 
                     day === 9 ? '初九' : 
                     day === 10 ? '初十' : 
                     day === 11 ? '十一' : 
                     day === 12 ? '十二' : 
                     day === 13 ? '十三' : 
                     day === 14 ? '十四' : 
                     day === 15 ? '十五' : 
                     day === 16 ? '十六' : 
                     day === 17 ? '十七' : 
                     day === 18 ? '十八' : 
                     day === 19 ? '十九' : 
                     day === 20 ? '二十' : 
                     day === 21 ? '二十一' : 
                     day === 22 ? '二十二' : 
                     day === 23 ? '二十三' : 
                     day === 24 ? '二十四' : 
                     day === 25 ? '二十五' : 
                     day === 26 ? '二十六' : 
                     day === 27 ? '二十七' : 
                     day === 28 ? '二十八' : 
                     day === 29 ? '二十九' : 
                     day === 30 ? '三十' : 
                     day === 31 ? '三十一' : 
                     `${day}`;
      
      return {
        year: year === '1' ? '元年' : `${year}年`,
        month,
        day: dayText
      };
    }
    return { year: '元年', month: '正月', day: '初一' };
  };

  const dateInfo = parseDateWithDay(gameState.date || '崇祯元年正月', gameState.turn || 1);

  return (
    <div className="palace-panel panel-decorated h-full flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <div>
          <h1 className="palace-title text-xl panel-title-decorated">崇祯{dateInfo.year}</h1>
          <p className="text-palace-text-muted text-sm">
            {dateInfo.month}{dateInfo.day} · {getPhaseIcon()} {getPhaseName()}
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
