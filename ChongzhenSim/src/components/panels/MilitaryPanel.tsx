import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { Minister } from '@/core/types';

// 模拟将领兵力数据
interface GeneralData {
  minister: Minister;
  troops: number;
  silverCost: number;
  grainCost: number;
  location: string;
}

// 根据将领生成模拟数据
function generateGeneralData(minister: Minister): GeneralData {
  const baseTroops = minister.competence * 100 + Math.floor(Math.random() * 5000);
  const troops = minister.department === 'military' ? baseTroops : Math.floor(baseTroops * 0.3);
  
  return {
    minister,
    troops,
    silverCost: Math.floor(troops * 0.05), // 每兵每月0.05两银
    grainCost: Math.floor(troops * 0.1),   // 每兵每月0.1石粮
    location: getGeneralLocation(minister),
  };
}

function getGeneralLocation(minister: Minister): string {
  const locationMap: Record<string, string> = {
    '蓟辽督师': '辽东',
    '宣大总督': '宣府大同',
    '三边总督': '陕西三边',
    '宁远总兵': '宁远',
    '山西总兵': '山西',
    '陕西巡抚': '陕西',
    '南京兵部尚书': '南京',
  };
  
  for (const [title, location] of Object.entries(locationMap)) {
    if (minister.title.includes(title)) return location;
  }
  
  return '京师';
}

function getLoyaltyColor(loyalty: number): string {
  if (loyalty >= 70) return 'text-success';
  if (loyalty >= 40) return 'text-warning';
  return 'text-danger';
}

function getCompetenceGrade(competence: number): string {
  if (competence >= 85) return 'S';
  if (competence >= 75) return 'A';
  if (competence >= 65) return 'B';
  if (competence >= 55) return 'C';
  return 'D';
}

interface GeneralCardProps {
  data: GeneralData;
}

function GeneralCard({ data }: GeneralCardProps) {
  const { minister, troops, silverCost, grainCost, location } = data;
  
  if (!minister.isAlive) {
    return null;
  }

  return (
    <div className="palace-card card-hover-glow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-lg">{minister.name}</span>
            <span className="palace-badge palace-badge-warning">{minister.factionLabel}</span>
          </div>
          <div className="text-sm text-palace-gold mt-1">{minister.title}</div>
          <div className="text-xs text-palace-text-muted mt-1">驻地：{location}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-palace-text-muted">能力评级</div>
          <div className={`text-2xl font-bold ${
            minister.competence >= 85 ? 'text-palace-gold' :
            minister.competence >= 75 ? 'text-success' :
            minister.competence >= 65 ? 'text-info' : 'text-palace-text-muted'
          }`}>
            {getCompetenceGrade(minister.competence)}
          </div>
        </div>
      </div>

      {/* 兵力信息 */}
      <div className="bg-palace-bg-light/50 rounded p-3 mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-palace-text-muted">统兵数量</span>
          <span className="text-lg font-medium text-palace-gold">
            {troops.toLocaleString()} <span className="text-xs text-palace-text-muted">人</span>
          </span>
        </div>
        <div className="palace-progress progress-glow">
          <div 
            className="palace-progress-bar palace-progress-info"
            style={{ width: `${Math.min(100, troops / 100)}%` }}
          />
        </div>
      </div>

      {/* 消耗信息 */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="stat-card">
          <div className="stat-card-label">月饷银消耗</div>
          <div className="text-warning font-medium">
            {silverCost.toLocaleString()} <span className="text-xs">两</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">月粮草消耗</div>
          <div className="text-info font-medium">
            {grainCost.toLocaleString()} <span className="text-xs">石</span>
          </div>
        </div>
      </div>

      {/* 属性 */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center p-2 bg-palace-bg-light/30 rounded">
          <div className="text-palace-text-muted">忠诚</div>
          <div className={`font-medium ${getLoyaltyColor(minister.loyalty)}`}>
            {minister.loyalty}
          </div>
        </div>
        <div className="text-center p-2 bg-palace-bg-light/30 rounded">
          <div className="text-palace-text-muted">能力</div>
          <div className="font-medium text-palace-text">{minister.competence}</div>
        </div>
        <div className="text-center p-2 bg-palace-bg-light/30 rounded">
          <div className="text-palace-text-muted">贪腐</div>
          <div className={`font-medium ${minister.corruption >= 50 ? 'text-danger' : 'text-success'}`}>
            {minister.corruption}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MilitaryPanel() {
  const { gameState } = useGameStore();

  const generals = useMemo(() => {
    if (!gameState?.ministers) return [];
    
    // 筛选军事将领和带兵官员
    const militaryMinisters = gameState.ministers.filter(m => 
      m.department === 'military' || 
      m.title.includes('总督') || 
      m.title.includes('总兵') ||
      m.title.includes('巡抚') ||
      m.title.includes('兵部')
    );
    
    return militaryMinisters
      .map(generateGeneralData)
      .filter(d => d.minister.isAlive)
      .sort((a, b) => b.troops - a.troops);
  }, [gameState?.ministers]);

  const totalStats = useMemo(() => {
    const totalTroops = generals.reduce((sum, g) => sum + g.troops, 0);
    const totalSilver = generals.reduce((sum, g) => sum + g.silverCost, 0);
    const totalGrain = generals.reduce((sum, g) => sum + g.grainCost, 0);
    
    return { totalTroops, totalSilver, totalGrain, count: generals.length };
  }, [generals]);

  return (
    <div className="military-panel h-full overflow-y-auto palace-scrollbar p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="palace-title text-xl panel-title-decorated">军事统览</h2>
        <div className="text-sm text-palace-text-muted">
          带兵将领 {totalStats.count} 人
        </div>
      </div>

      {/* 总览统计 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="stat-card glow-pulse">
          <div className="stat-card-label">总兵力</div>
          <div className="stat-card-value text-palace-gold">
            {totalStats.totalTroops.toLocaleString()}
          </div>
          <div className="text-xs text-palace-text-muted">人</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">月饷银</div>
          <div className="stat-card-value text-warning">
            {totalStats.totalSilver.toLocaleString()}
          </div>
          <div className="text-xs text-palace-text-muted">两</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">月粮草</div>
          <div className="stat-card-value text-info">
            {totalStats.totalGrain.toLocaleString()}
          </div>
          <div className="text-xs text-palace-text-muted">石</div>
        </div>
      </div>

      <div className="divider-decorated mb-4" />

      {/* 将领列表 */}
      <div className="space-y-3">
        {generals.map(data => (
          <GeneralCard key={data.minister.id} data={data} />
        ))}
      </div>

      {generals.length === 0 && (
        <div className="text-center text-palace-text-muted py-8">
          暂无带兵将领
        </div>
      )}
    </div>
  );
}
