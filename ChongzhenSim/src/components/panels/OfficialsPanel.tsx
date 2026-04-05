import { useMemo, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { Minister } from '@/core/types';

// ========================================
// 官职层级配置
// ========================================

interface PositionConfig {
  title: string;
  level: number; // 层级，数字越小越重要
  category: string;
  categoryIcon: string;
  isUnique: boolean; // 是否唯一职位
}

// 官职层级定义（按重要性排序）
const POSITION_HIERARCHY: PositionConfig[] = [
  // 内阁 - 最高决策层
  { title: '内阁首辅', level: 1, category: '内阁', categoryIcon: '🏛️', isUnique: true },
  { title: '内阁次辅', level: 2, category: '内阁', categoryIcon: '🏛️', isUnique: true },
  { title: '文渊阁大学士', level: 3, category: '内阁', categoryIcon: '🏛️', isUnique: false },
  { title: '东阁大学士', level: 3, category: '内阁', categoryIcon: '🏛️', isUnique: false },
  { title: '武英殿大学士', level: 3, category: '内阁', categoryIcon: '🏛️', isUnique: false },
  
  // 六部尚书 - 行政核心
  { title: '吏部尚书', level: 4, category: '六部', categoryIcon: '📜', isUnique: true },
  { title: '户部尚书', level: 4, category: '六部', categoryIcon: '📜', isUnique: true },
  { title: '礼部尚书', level: 4, category: '六部', categoryIcon: '📜', isUnique: true },
  { title: '兵部尚书', level: 4, category: '六部', categoryIcon: '📜', isUnique: true },
  { title: '刑部尚书', level: 4, category: '六部', categoryIcon: '📜', isUnique: true },
  { title: '工部尚书', level: 4, category: '六部', categoryIcon: '📜', isUnique: true },
  
  // 都察院 - 监察系统
  { title: '左都御史', level: 5, category: '都察院', categoryIcon: '⚖️', isUnique: true },
  { title: '右都御史', level: 5, category: '都察院', categoryIcon: '⚖️', isUnique: true },
  
  // 总督巡抚 - 地方大员
  { title: '蓟辽督师', level: 6, category: '督抚', categoryIcon: '🏯', isUnique: true },
  { title: '三边总督', level: 6, category: '督抚', categoryIcon: '🏯', isUnique: true },
  { title: '宣大总督', level: 6, category: '督抚', categoryIcon: '🏯', isUnique: true },
  { title: '陕西巡抚', level: 7, category: '督抚', categoryIcon: '🏯', isUnique: false },
  
  // 总兵 - 武将
  { title: '宁远总兵', level: 8, category: '武将', categoryIcon: '⚔️', isUnique: false },
  { title: '山西总兵', level: 8, category: '武将', categoryIcon: '⚔️', isUnique: false },
  
  // 内廷
  { title: '司礼监掌印太监', level: 2, category: '内廷', categoryIcon: '👑', isUnique: true },
];

// 获取官职配置


// ========================================
// 派系颜色和样式
// ========================================

function getFactionBadgeClass(faction: string): string {
  switch (faction) {
    case 'donglin': return 'palace-badge-success';
    case 'eunuch': return 'palace-badge-red';
    case 'neutral': return 'palace-badge-gold';
    case 'military': return 'palace-badge-warning';
    case 'imperial': return 'palace-badge-gold';
    default: return 'palace-badge-gold';
  }
}

function getLevelBadgeClass(level: number): string {
  if (level <= 2) return 'official-level-highest';
  if (level <= 4) return 'official-level-high';
  if (level <= 6) return 'official-level-medium';
  return 'official-level-normal';
}

// ========================================
// 官员选择弹窗组件
// ========================================

interface OfficialSelectModalProps {
  positionTitle: string;
  currentOfficial: Minister | null;
  candidates: Minister[];
  onSelect: (ministerId: string) => void;
  onClose: () => void;
}

function OfficialSelectModal({ 
  positionTitle, 
  currentOfficial, 
  candidates, 
  onSelect, 
  onClose 
}: OfficialSelectModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // 按能力排序候选人
  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => b.competence - a.competence);
  }, [candidates]);

  return (
    <div className="palace-modal-overlay" onClick={onClose}>
      <div 
        className="palace-modal official-select-modal" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="palace-title text-lg">选择官员</h3>
            <p className="text-sm text-palace-text-muted mt-1">
              职位：{positionTitle}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-palace-text-muted hover:text-palace-gold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 当前任职 */}
        {currentOfficial && (
          <div className="mb-4 p-3 bg-palace-bg-light rounded-lg border border-palace-border">
            <div className="text-xs text-palace-text-muted mb-2">当前任职</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-medium text-palace-gold">{currentOfficial.name}</span>
                <span className={`palace-badge ${getFactionBadgeClass(currentOfficial.faction)}`}>
                  {currentOfficial.factionLabel}
                </span>
              </div>
              <div className="flex gap-4 text-xs">
                <span>忠诚: <span className={currentOfficial.loyalty >= 60 ? 'text-success' : 'text-warning'}>{currentOfficial.loyalty}</span></span>
                <span>能力: <span className="text-palace-text">{currentOfficial.competence}</span></span>
                <span>贪腐: <span className={currentOfficial.corruption >= 50 ? 'text-danger' : 'text-success'}>{currentOfficial.corruption}</span></span>
              </div>
            </div>
          </div>
        )}

        <div className="palace-divider mb-4" />

        {/* 候选人列表 */}
        <div className="text-sm text-palace-text-muted mb-2">
          可选候选人 ({sortedCandidates.length}人)
        </div>
        
        <div className="candidates-list max-h-80 overflow-y-auto palace-scrollbar space-y-2">
          {sortedCandidates.map(minister => (
            <div
              key={minister.id}
              className={`candidate-card p-3 rounded-lg border cursor-pointer transition-all ${
                selectedId === minister.id 
                  ? 'border-palace-gold bg-palace-gold/10' 
                  : 'border-palace-border hover:border-palace-gold/50'
              }`}
              onClick={() => setSelectedId(minister.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{minister.name}</span>
                  <span className={`palace-badge ${getFactionBadgeClass(minister.faction)}`}>
                    {minister.factionLabel}
                  </span>
                </div>
                <span className="text-xs text-palace-text-muted">{minister.title}</span>
              </div>
              
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-palace-text-muted">忠诚</div>
                  <div className={`font-medium ${minister.loyalty >= 60 ? 'text-success' : minister.loyalty >= 40 ? 'text-warning' : 'text-danger'}`}>
                    {minister.loyalty}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-palace-text-muted">能力</div>
                  <div className="font-medium text-palace-text">{minister.competence}</div>
                </div>
                <div className="text-center">
                  <div className="text-palace-text-muted">贪腐</div>
                  <div className={`font-medium ${minister.corruption >= 50 ? 'text-danger' : minister.corruption >= 30 ? 'text-warning' : 'text-success'}`}>
                    {minister.corruption}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-palace-text-muted">关系</div>
                  <div className={`font-medium ${minister.relationship >= 50 ? 'text-success' : minister.relationship >= 30 ? 'text-warning' : 'text-danger'}`}>
                    {minister.relationship}
                  </div>
                </div>
              </div>

              {minister.summary && (
                <div className="text-xs text-palace-text-muted mt-2 line-clamp-1">
                  {minister.summary}
                </div>
              )}
            </div>
          ))}
          
          {sortedCandidates.length === 0 && (
            <div className="text-center py-8 text-palace-text-muted">
              暂无合适候选人
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-palace-border">
          <button 
            onClick={onClose}
            className="palace-button-outline px-4 py-2"
          >
            取消
          </button>
          <button 
            onClick={() => selectedId && onSelect(selectedId)}
            disabled={!selectedId}
            className={`palace-button-gold px-4 py-2 ${!selectedId ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            确认任命
          </button>
        </div>
      </div>
    </div>
  );
}

// ========================================
// 官职卡片组件
// ========================================

interface PositionCardProps {
  position: PositionConfig;
  official: Minister | null;
  onClick: () => void;
}

function PositionCard({ position, official, onClick }: PositionCardProps) {
  const isCabinet = position.category === '内阁';
  const isHighLevel = position.level <= 2;
  
  return (
    <div 
      className={`position-card ${getLevelBadgeClass(position.level)} ${
        isCabinet ? 'position-card-cabinet' : ''
      } ${isHighLevel ? 'position-card-highlight' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="position-title">{position.title}</span>
          {isHighLevel && <span className="level-indicator" />}
        </div>
        <span className="text-xs text-palace-text-muted cursor-pointer hover:text-palace-gold">
          更换
        </span>
      </div>
      
      {official ? (
        <>
          <div className="flex items-center gap-2 mb-2">
            <span className="official-name">{official.name}</span>
            <span className={`palace-badge ${getFactionBadgeClass(official.faction)}`}>
              {official.factionLabel}
            </span>
          </div>
          
          <div className="grid grid-cols-4 gap-1 text-xs">
            <div className="text-center">
              <span className="text-palace-text-muted">忠</span>
              <span className={`ml-1 ${official.loyalty >= 60 ? 'text-success' : official.loyalty >= 40 ? 'text-warning' : 'text-danger'}`}>
                {official.loyalty}
              </span>
            </div>
            <div className="text-center">
              <span className="text-palace-text-muted">能</span>
              <span className="ml-1 text-palace-text">{official.competence}</span>
            </div>
            <div className="text-center">
              <span className="text-palace-text-muted">贪</span>
              <span className={`ml-1 ${official.corruption >= 50 ? 'text-danger' : 'text-success'}`}>
                {official.corruption}
              </span>
            </div>
            <div className="text-center">
              <span className="text-palace-text-muted">关</span>
              <span className={`ml-1 ${official.relationship >= 50 ? 'text-success' : 'text-warning'}`}>
                {official.relationship}
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="text-palace-text-muted text-sm py-2">
          空缺中...
        </div>
      )}
    </div>
  );
}

// ========================================
// 主面板组件
// ========================================

export function OfficialsPanel() {
  const { gameState, replaceOfficial } = useGameStore();
  const [selectedPosition, setSelectedPosition] = useState<PositionConfig | null>(null);
  
  // 按官职层级组织官员
  const officialsByPosition = useMemo(() => {
    if (!gameState?.ministers) return new Map<string, Minister>();
    
    const map = new Map<string, Minister>();
    const aliveMinisters = gameState.ministers.filter(m => m.isAlive);
    
    // 遍历所有官职配置，找到对应的官员
    POSITION_HIERARCHY.forEach(position => {
      const official = aliveMinisters.find(m => 
        m.title.includes(position.title) || 
        position.title.includes(m.title.replace('尚书', '').replace('总督', '').replace('总兵', ''))
      );
      if (official) {
        map.set(position.title, official);
      }
    });
    
    return map;
  }, [gameState.ministers]);

  // 获取候选人列表（排除当前职位的人）
  const getCandidates = (positionTitle: string): Minister[] => {
    if (!gameState?.ministers) return [];
    
    const currentOfficial = officialsByPosition.get(positionTitle);
    
    return gameState.ministers.filter(m => 
      m.isAlive && 
      m.id !== currentOfficial?.id &&
      !POSITION_HIERARCHY.some(p => 
        p.level <= 4 && // 只考虑较低层级的职位
        officialsByPosition.get(p.title)?.id === m.id
      )
    );
  };

  // 处理官员更换
  const handleReplace = (newMinisterId: string) => {
    if (selectedPosition) {
      replaceOfficial(selectedPosition.title, newMinisterId);
      setSelectedPosition(null);
    }
  };

  // 统计信息
  const stats = useMemo(() => {
    if (!gameState?.ministers) return { total: 0, alive: 0, byFaction: {} };
    
    const alive = gameState.ministers.filter(m => m.isAlive);
    const byFaction = alive.reduce((acc, m) => {
      acc[m.factionLabel] = (acc[m.factionLabel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { total: gameState.ministers.length, alive: alive.length, byFaction };
  }, [gameState.ministers]);

  // 按类别分组官职
  const positionsByCategory = useMemo(() => {
    const categories = new Map<string, PositionConfig[]>();
    
    POSITION_HIERARCHY.forEach(position => {
      const list = categories.get(position.category) || [];
      list.push(position);
      categories.set(position.category, list);
    });
    
    return categories;
  }, []);

  // 类别显示顺序
  const categoryOrder = ['内阁', '六部', '都察院', '督抚', '武将', '内廷'];

  return (
    <div className="officials-panel h-full overflow-y-auto palace-scrollbar p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="palace-title text-xl panel-title-decorated">众正盈朝</h2>
        <div className="text-sm text-palace-text-muted">
          在朝官员 {stats.alive} / {stats.total} 人
        </div>
      </div>

      {/* 派系统计 */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {Object.entries(stats.byFaction).map(([faction, count]) => (
          <div key={faction} className="stat-card">
            <div className="stat-card-label">{faction}</div>
            <div className="stat-card-value text-lg">{count}</div>
          </div>
        ))}
      </div>

      <div className="divider-decorated mb-4" />

      {/* 官职层级展示 */}
      <div className="space-y-6">
        {categoryOrder.map(category => {
          const positions = positionsByCategory.get(category);
          if (!positions || positions.length === 0) return null;
          
          const categoryIcon = positions[0]?.categoryIcon || '📋';
          
          return (
            <div key={category} className="category-section">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{categoryIcon}</span>
                <h3 className="palace-title text-base">{category}</h3>
                <span className="ml-auto text-xs text-palace-text-muted">
                  {positions.length} 职
                </span>
              </div>
              
              <div className={`grid gap-3 ${
                category === '内阁' ? 'grid-cols-1' :
                category === '六部' ? 'grid-cols-2' :
                'grid-cols-2'
              }`}>
                {positions.map(position => (
                  <PositionCard
                    key={position.title}
                    position={position}
                    official={officialsByPosition.get(position.title) || null}
                    onClick={() => setSelectedPosition(position)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 官员选择弹窗 */}
      {selectedPosition && (
        <OfficialSelectModal
          positionTitle={selectedPosition.title}
          currentOfficial={officialsByPosition.get(selectedPosition.title) || null}
          candidates={getCandidates(selectedPosition.title)}
          onSelect={handleReplace}
          onClose={() => setSelectedPosition(null)}
        />
      )}
    </div>
  );
}
