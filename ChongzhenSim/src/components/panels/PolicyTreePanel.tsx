import React, { useState, useMemo } from 'react';
import { usePolicyStore } from '@/store/policyStore';
import { useGameStore } from '@/store/gameStore';
import {
  POLICY_CATEGORIES,
  type PolicyCategory,
  type NationalPolicy,
} from '@/data/policies/nationalPolicies';

export function PolicyTreePanel() {
  const [activeCategory, setActiveCategory] = useState<PolicyCategory>('internal');
  const { policies, getPoliciesByCategory, canStartResearch, cancelResearch } = usePolicyStore();
  const { gameState, applyPlayerDecision } = useGameStore();

  const currentPolicies = useMemo(
    () => getPoliciesByCategory(activeCategory),
    [activeCategory, policies]
  );

  // 统计各分类完成度
  const categoryStats = useMemo(() => {
    return Object.keys(POLICY_CATEGORIES).reduce((acc, cat) => {
      const catPolicies = getPoliciesByCategory(cat as PolicyCategory);
      acc[cat] = {
        total: catPolicies.length,
        completed: catPolicies.filter(p => p.status === 'completed').length,
        researching: catPolicies.filter(p => p.status === 'researching').length,
      };
      return acc;
    }, {} as Record<string, { total: number; completed: number; researching: number }>);
  }, [policies]);

  const handleStartResearch = (policyId: string) => {
    applyPlayerDecision({ type: 'start_policy_research', policyId, effects: [] });
  };

  const handleCancelResearch = (policyId: string) => {
    cancelResearch(policyId);
  };

  const handleJumpToPrereq = (prereqId: string) => {
    const prereq = policies.find(p => p.id === prereqId);
    if (prereq) setActiveCategory(prereq.category);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 标题栏 */}
      <div className="panel-decorated bg-palace-bg-light border-b border-palace-border p-4 flex justify-between items-center flex-shrink-0">
        <div>
          <span className="palace-title text-xl panel-title-decorated">
            国策树
          </span>
          <span className="text-palace-text-muted text-sm ml-4">
            {policies.filter(p => p.status === 'completed').length} / {policies.length} 已完成
          </span>
        </div>
      </div>

      {/* 主体区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧分类 Tab */}
        <div className="w-32 border-r border-palace-border flex flex-col p-2 flex-shrink-0 overflow-y-auto palace-scrollbar bg-palace-bg-card/50">
          {(Object.entries(POLICY_CATEGORIES) as [PolicyCategory, { label: string; icon: string; color: string }][]).map(([cat, info]) => {
            const stats = categoryStats[cat];
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`w-full text-left p-3 mb-1 rounded-md transition-all duration-200 ${isActive ? 'bg-palace-gold/10 border-l-2 border-palace-gold text-palace-gold tab-active-glow' : 'text-palace-text-muted hover:bg-palace-gold/5 hover:border-l-2 hover:border-palace-gold/30 hover:text-palace-gold'}`}
              >
                <div className="mb-1 font-serif">{info.icon} {info.label}</div>
                <div className="text-xs text-palace-text-muted">
                  {stats.completed}/{stats.total}
                  {stats.researching > 0 && (
                    <span className="text-warning ml-1">
                      ·{stats.researching}研
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 右侧国策列表 */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 align-content-start palace-scrollbar">
          {currentPolicies.map(policy => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              gameState={gameState}
              canResearch={gameState ? canStartResearch(policy.id, gameState) : { canResearch: false, reason: '游戏未初始化' }}
              onStartResearch={() => handleStartResearch(policy.id)}
              onCancelResearch={() => handleCancelResearch(policy.id)}
              onJumpToPrereq={(prereqId) => handleJumpToPrereq(prereqId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// 国策卡片子组件
interface PolicyCardProps {
  policy: NationalPolicy;
  gameState: any;
  canResearch: { canResearch: boolean; reason?: string };
  onStartResearch: () => void;
  onCancelResearch: () => void;
  onJumpToPrereq: (id: string) => void;
}

const PolicyCard: React.FC<PolicyCardProps> = ({
  policy, canResearch, onStartResearch, onCancelResearch, onJumpToPrereq
}) => {
  const { policies } = usePolicyStore();

  const getCardClass = () => {
    switch (policy.status) {
      case 'completed':
        return 'border-success bg-success/5 glow-pulse';
      case 'researching':
        return 'border-warning bg-warning/5';
      case 'available':
        return 'border-palace-gold bg-palace-gold/5 card-hover-glow';
      case 'locked':
        return 'border-palace-border bg-palace-bg-light/50 opacity-60';
      default:
        return 'border-palace-border bg-palace-bg-light';
    }
  };

  return (
    <div className={`palace-card ${getCardClass()} p-4 flex flex-col gap-3 transition-all duration-200`}>
      {/* 卡片标题 */}
      <div className="flex justify-between items-start">
        <span className={`font-serif font-medium ${policy.status === 'locked' ? 'text-palace-text-muted' : 'text-palace-gold'}`}>
          {policy.status === 'completed' ? '✓ ' : ''}{policy.name}
        </span>
        <div className="flex gap-2">
          {policy.isHistorical && (
            <span className="text-xs text-success border border-success rounded-sm px-1.5 py-0.5 flex-shrink-0 palace-badge-success">史实</span>
          )}
          {!policy.isHistorical && (
            <span className="text-xs text-[#eb2f96] border border-[#eb2f96] rounded-sm px-1.5 py-0.5 flex-shrink-0 palace-badge-red">脑洞</span>
          )}
        </div>
      </div>

      {/* 描述 */}
      <div className="text-palace-text-muted text-sm">
        {policy.description}
      </div>

      {/* 历史典故 */}
      {policy.flavorText && (
        <div className="text-palace-text-muted text-xs italic border-l-2 border-palace-border pl-3 py-1 bg-palace-bg-card/50 rounded-r">
          {policy.flavorText}
        </div>
      )}

      {/* 效果摘要 */}
      <div className="flex flex-wrap gap-2">
        {policy.effects.slice(0, 3).map((eff, i) => (
          <span key={i} className={`text-xs px-2 py-1 rounded ${eff.delta > 0 ? 'text-success bg-success/15' : 'text-danger bg-danger/15'}`}>
            {eff.delta > 0 ? '+' : ''}{eff.delta} {eff.description.split('+')[0].split('-')[0].trim()}
          </span>
        ))}
      </div>

      {/* 费用与时间 */}
      <div className="flex gap-4 text-palace-text-muted text-xs border-t border-palace-border pt-3">
        <span>💰 {policy.cost > 0 ? `${policy.cost}万两` : '无费用'}</span>
        <span>⏳ {policy.researchTurns}回合</span>
      </div>

      {/* 研究进度条（researching状态） */}
      {policy.status === 'researching' && policy.remainingTurns !== undefined && (
        <div className="mt-2">
          <div className="palace-progress progress-glow">
            <div 
              className="palace-progress-bar palace-progress-warning"
              style={{ width: `${((policy.researchTurns - policy.remainingTurns) / policy.researchTurns) * 100}%` }}
            />
          </div>
          <div className="text-warning text-xs mt-1 text-center">
            剩余 {policy.remainingTurns} 回合
          </div>
        </div>
      )}

      {/* 底部操作区 */}
      <div className="mt-auto">
        {policy.status === 'locked' && (
          <div className="text-palace-text-muted text-xs">
            🔒 前置：
            {policy.requirements.prerequisitePolicies.map((reqId, i) => {
              const req = policies.find(p => p.id === reqId);
              return (
                <span
                  key={reqId}
                  onClick={() => onJumpToPrereq(reqId)}
                  className={`cursor-pointer underline ${req?.status === 'completed' ? 'text-success' : 'text-palace-gold'}`}
                  style={{ marginLeft: i === 0 ? '4px' : '0' }}
                >
                  {req?.name ?? reqId}
                  {i < policy.requirements.prerequisitePolicies.length - 1 ? '、' : ''}
                </span>
              );
            })}
          </div>
        )}

        {policy.status === 'available' && (
          <button
            onClick={onStartResearch}
            disabled={!canResearch.canResearch}
            title={canResearch.reason}
            className={`w-full py-2 rounded-md font-serif text-sm transition-all ${canResearch.canResearch ? 'palace-button-gold btn-glow' : 'palace-button-outline opacity-50 cursor-not-allowed'}`}
          >
            {canResearch.canResearch ? '开始研究' : (canResearch.reason ?? '条件不满足')}
          </button>
        )}

        {policy.status === 'researching' && (
          <button
            onClick={onCancelResearch}
            className="w-full py-2 bg-danger/10 border border-danger rounded-md text-danger font-serif text-sm transition-all hover:bg-danger/20"
          >
            取消研究
          </button>
        )}

        {policy.status === 'completed' && (
          <div className="text-center text-success text-sm py-2">
            ✓ 已完成
          </div>
        )}
      </div>
    </div>
  );
};
