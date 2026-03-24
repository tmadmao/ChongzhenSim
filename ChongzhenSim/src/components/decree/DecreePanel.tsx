import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { EffectType, GameEffect } from '../../core/types';

interface DecreePanelProps {
  onClose: () => void;
}

interface DecreeEffect {
  type: EffectType;
  target?: string;
  field: string;
  delta: number;
  description: string;
}

interface DecreeOption {
  id: string;
  title: string;
  description: string;
  effects: DecreeEffect[];
  cost: number;
  requirements?: { minGold?: number; minMorale?: number };
}

const decreeOptions: DecreeOption[] = [
  {
    id: 'reduce_tax',
    title: '减税诏',
    description: '天下大赦，减免全国赋税一成，以安民心。',
    effects: [
      { type: 'nation', field: 'peopleMorale', delta: 10, description: '民心 +10' }
    ],
    cost: 50,
    requirements: { minGold: 100 }
  },
  {
    id: 'military_levy',
    title: '征兵诏',
    description: '招募天下勇士，充实边防军力。',
    effects: [
      { type: 'nation', field: 'militaryPower', delta: 15, description: '军力 +15' },
      { type: 'nation', field: 'peopleMorale', delta: -5, description: '民心 -5' }
    ],
    cost: 100,
    requirements: { minGold: 200 }
  },
  {
    id: 'anti_corruption',
    title: '肃贪诏',
    description: '严查贪官污吏，整顿吏治。',
    effects: [
      { type: 'nation', field: 'overallCorruption', delta: -10, description: '腐败度 -10' }
    ],
    cost: 30,
    requirements: { minGold: 50 }
  },
  {
    id: 'disaster_relief',
    title: '赈灾诏',
    description: '拨银赈济灾民，安抚流离。',
    effects: [
      { type: 'nation', field: 'peopleMorale', delta: 15, description: '民心 +15' }
    ],
    cost: 80,
    requirements: { minGold: 150 }
  },
  {
    id: 'border_fortify',
    title: '固边诏',
    description: '加固边防城池，抵御外敌入侵。',
    effects: [
      { type: 'nation', field: 'borderThreat', delta: -15, description: '边患 -15' }
    ],
    cost: 120,
    requirements: { minGold: 200 }
  },
  {
    id: 'agriculture_promote',
    title: '劝农诏',
    description: '鼓励农桑，兴修水利，增加粮食产量。',
    effects: [
      { type: 'nation', field: 'agriculturalOutput', delta: 10, description: '农业产出 +10' }
    ],
    cost: 60,
    requirements: { minGold: 100 }
  }
];

export function DecreePanel({ onClose }: DecreePanelProps) {
  const { gameState, applyPlayerDecision, addTurnLog } = useGameStore();
  const [selectedDecree, setSelectedDecree] = useState<DecreeOption | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);
  const [issuedDecrees, setIssuedDecrees] = useState<string[]>([]);

  const treasury = gameState?.treasury.gold || 0;

  const canIssueDecree = (decree: DecreeOption) => {
    if (issuedDecrees.includes(decree.id)) return false;
    if (treasury < decree.cost) return false;
    if (decree.requirements?.minGold && treasury < decree.requirements.minGold) return false;
    return true;
  };

  const handleIssueDecree = async (decree: DecreeOption) => {
    if (!canIssueDecree(decree)) return;

    setIsIssuing(true);
    setSelectedDecree(decree);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const gameEffects: GameEffect[] = [
      ...decree.effects.map(e => ({
        ...e,
        target: e.target || ''
      })),
      { type: 'treasury' as const, target: '', field: 'gold', delta: -decree.cost, description: `国库 -${decree.cost}万两` }
    ];

    applyPlayerDecision({
      type: 'decree',
      choiceId: decree.id,
      effects: gameEffects
    });

    addTurnLog(`颁布诏书：${decree.title}`);
    setIssuedDecrees(prev => [...prev, decree.id]);
    setIsIssuing(false);
    setSelectedDecree(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="palace-panel w-[700px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-palace-border">
          <div>
            <h2 className="palace-title text-xl">发布诏书</h2>
            <p className="text-palace-text-muted text-sm mt-1">
              国库：{treasury.toFixed(0)} 万两
            </p>
          </div>
          <button onClick={onClose} className="text-palace-text-muted hover:text-palace-text text-2xl">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto palace-scrollbar p-4">
          <div className="grid gap-4">
            {decreeOptions.map(decree => {
              const canIssue = canIssueDecree(decree);
              const isIssued = issuedDecrees.includes(decree.id);

              return (
                <div
                  key={decree.id}
                  className={`palace-card p-4 transition-all ${
                    isIssued 
                      ? 'opacity-50 border-palace-border' 
                      : canIssue 
                        ? 'hover:border-palace-gold cursor-pointer' 
                        : 'opacity-60'
                  } ${selectedDecree?.id === decree.id ? 'border-palace-gold' : ''}`}
                  onClick={() => canIssue && handleIssueDecree(decree)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-palace-text font-semibold text-lg">{decree.title}</h3>
                        {isIssued && (
                          <span className="text-xs bg-palace-gold/20 text-palace-gold px-2 py-0.5 rounded">
                            已颁布
                          </span>
                        )}
                      </div>
                      <p className="text-palace-text-muted text-sm mt-1">{decree.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        {decree.effects.map((effect, i) => (
                          <span
                            key={i}
                            className={`text-xs px-2 py-1 rounded ${
                              effect.delta > 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                            }`}
                          >
                            {effect.description}
                          </span>
                        ))}
                        <span className="text-xs px-2 py-1 rounded bg-yellow-900/30 text-yellow-400">
                          耗银 {decree.cost}万两
                        </span>
                      </div>
                    </div>
                    
                    {!isIssued && (
                      <div className="ml-4">
                        {canIssue ? (
                          <button
                            disabled={isIssuing && selectedDecree?.id === decree.id}
                            className="palace-button-gold text-sm px-4 py-2 disabled:opacity-50"
                          >
                            {isIssuing && selectedDecree?.id === decree.id ? '颁布中...' : '颁布'}
                          </button>
                        ) : (
                          <span className="text-palace-text-muted text-xs">
                            {treasury < decree.cost ? '银两不足' : '条件不足'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-palace-border flex justify-between items-center">
          <p className="text-palace-text-muted text-xs">
            每道诏书每回合只能颁布一次
          </p>
          <button onClick={onClose} className="palace-button-outline">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
