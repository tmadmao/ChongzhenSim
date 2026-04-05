import { useState, useEffect } from 'react';
import { useCourtStore } from '@/store/courtStore';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { courtSystem } from '@/systems/courtSystem';
import type { CourtMemorial, MemorialChoice } from '@/data/scenario/day1Script';
import type { GameEffect } from '@/core/types';
import type { ChoiceRecord } from '@/store/courtStore';

export function CourtPanel() {
  const { gameState } = useGameStore();
  const { gameMode } = useSettingsStore();
  const {
    phase,
    memorials,
    currentMemorialIndex,
    choiceRecords,
    hasCourtedThisTurn,
    initCourt,
    startOpening,
    proceedToDecision,
    makeChoice,
    submitLLMDecree,
    dismissCourt
  } = useCourtStore();

  useEffect(() => {
    const loadMemorials = async () => {
      if (gameState) {
        const memorials = await courtSystem.getMemorialsForTurn(gameState.turn, gameState, gameMode);
        const sessionMeta = courtSystem.getSessionMeta(gameState.turn);
        initCourt(memorials, sessionMeta);
      }
    };
    loadMemorials();
  }, [gameState, gameMode, initCourt]);

  const handleStartCourt = () => {
    startOpening();
  };

  const handleMakeChoice = async (memorial: CourtMemorial, choice: MemorialChoice) => {
    await makeChoice(memorial, choice);
  };

  const handleDirectDecree = () => {
    // LLM 自拟圣旨接口占位，当前阶段仅保留入口。
    submitLLMDecree('LLM 自拟圣旨占位');
    console.warn('[CourtPanel] LLM 自拟圣旨接口已触发（占位）');
    // TODO: future版本将弹出编辑器，让玩家输入圣旨内容并由大模型推演。
  };

  const handleProceedToDecision = () => {
    proceedToDecision();
  };

  const handleDismissCourt = () => {
    dismissCourt();
  };

  return (
    <div className="h-full max-h-full flex flex-col overflow-hidden">
      {/* 标题栏 */}
      <div className="panel-decorated bg-palace-bg-light border-b border-palace-border p-4 flex justify-between items-center flex-shrink-0">
        <div>
          <span className="palace-title text-xl panel-title-decorated">
            皇极殿
          </span>
          <span className="text-palace-text-muted text-sm ml-4">
            大朝会与剧本事件
          </span>
        </div>
      </div>

      {/* 主体区域 */}
      <div className="flex-1 overflow-y-auto p-6 palace-scrollbar min-h-0">
        {phase === 'closed' && <CourtEntrance onStartCourt={handleStartCourt} hasCourtedThisTurn={hasCourtedThisTurn} />}
        {phase === 'opening' && <CourtOpening />}
        {phase === 'discussion' && memorials[currentMemorialIndex] && (
          <CourtDiscussionView
            memorial={memorials[currentMemorialIndex]}
            onProceedToDecision={handleProceedToDecision}
          />
        )}
        {phase === 'decision' && memorials[currentMemorialIndex] && (
          <CourtDecisionView
            memorial={memorials[currentMemorialIndex]}
            gameMode={gameMode}
            onMakeChoice={handleMakeChoice}
            onDirectDecree={handleDirectDecree}
          />
        )}
        {phase === 'summary' && (
          <CourtSummaryView
            choiceRecords={choiceRecords}
            onDismissCourt={handleDismissCourt}
          />
        )}
      </div>
    </div>
  );
}

function CourtEntrance({ onStartCourt, hasCourtedThisTurn }: { onStartCourt: () => void; hasCourtedThisTurn: boolean }) {
  if (hasCourtedThisTurn) {
    return (
      <div className="palace-card p-8 text-center">
        <div className="palace-title text-3xl mb-6">皇极殿</div>
        <div className="text-palace-text-muted mb-8">
          崇祯皇帝开大朝会的地方
        </div>
        <div className="text-palace-text mb-12 max-w-2xl mx-auto">
          <p className="mb-4">今日早朝已结束，诸臣已退去。</p>
          <p className="mb-4">陛下可召见大臣咨询，或者结束当前回合开始结算。</p>
          <p>结束回合后，将进入下一天的早朝。</p>
        </div>
        <div className="text-palace-text-muted text-sm">
          今日已退朝
        </div>
      </div>
    );
  }

  return (
    <div className="palace-card p-8 text-center">
      <div className="palace-title text-3xl mb-6">皇极殿</div>
      <div className="text-palace-text-muted mb-8">
        崇祯皇帝开大朝会的地方
      </div>
      <div className="text-palace-text mb-12 max-w-2xl mx-auto">
        <p className="mb-4">每日清晨，文武百官齐聚皇极殿，向皇上奏报国家大事。</p>
        <p className="mb-4">你将在这里处理朝政，做出影响国家命运的决策。</p>
        <p>每回合最多会有3位大臣奏报，处理完毕后可退朝。</p>
      </div>
      <button
        onClick={onStartCourt}
        className="palace-button-gold text-lg px-8 py-3"
      >
        鸣鞭·上朝
      </button>
    </div>
  );
}

function CourtOpening() {
  return (
    <div className="palace-card p-8 text-center">
      <div className="palace-title text-2xl mb-8">上朝</div>
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-palace-bg-light border border-palace-border flex items-center justify-center mb-4">
          <span className="text-2xl font-bold">王</span>
        </div>
        <div className="text-palace-text-muted mb-2">司礼监秉笔太监</div>
        <div className="palace-title text-lg">王承恩</div>
      </div>
      <div className="text-palace-text-muted mb-12">
        <div className="mb-4 text-xl">「皇上驾到！」</div>
        <div className="mb-4">百官：「吾皇万岁万岁万万岁！」</div>
        <div className="text-palace-gold text-lg">崇祯皇帝：「众爱卿平身。有事起奏，无事退朝。」</div>
      </div>
      <div className="text-palace-text-muted">
        正在准备大臣奏报...
      </div>
    </div>
  );
}

function CourtDiscussionView({ 
  memorial, 
  onProceedToDecision 
}: { 
  memorial: CourtMemorial; 
  onProceedToDecision: () => void; 
}) {
  const [currentSpeaker, setCurrentSpeaker] = useState(0);
  const [showNextButton, setShowNextButton] = useState(false);

  // 模拟大臣讨论顺序：主要奏报大臣 -> 其他派系大臣 -> 皇帝决策
  const discussionSequence = [
    {
      speaker: memorial,
      content: memorial.content,
      isMain: true
    },
    // 这里可以扩展为多个大臣的讨论
    // 暂时只显示主要奏报大臣
  ];

  useEffect(() => {
    if (currentSpeaker < discussionSequence.length) {
      const timer = setTimeout(() => {
        setShowNextButton(true);
      }, 2000); // 2秒后显示下一步按钮
      return () => clearTimeout(timer);
    }
  }, [currentSpeaker]);

  const handleNextSpeaker = () => {
    if (currentSpeaker < discussionSequence.length - 1) {
      setCurrentSpeaker(currentSpeaker + 1);
      setShowNextButton(false);
    } else {
      onProceedToDecision();
    }
  };

  const speaker = discussionSequence[currentSpeaker];

  return (
    <div className="palace-card p-8">
      <div className="text-center mb-6">
        <div className="palace-title text-xl mb-2">大臣奏对</div>
        <div className="text-palace-text-muted">文武百官分列两班</div>
      </div>

      {speaker && (
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-palace-bg-light border border-palace-border flex items-center justify-center">
              <span className="text-xl font-bold">{speaker.speaker.ministerName.charAt(0)}</span>
            </div>
            <div>
              <div className="palace-title text-lg">{speaker.speaker.ministerName}</div>
              <div className="text-palace-text-muted">{speaker.speaker.ministerTitle}</div>
              <div className="text-xs text-palace-text-muted">派系：{speaker.speaker.ministerFaction}</div>
            </div>
          </div>

          <div className="bg-palace-bg-light p-4 rounded border border-palace-border">
            <div className="text-palace-text leading-relaxed">
              {speaker.isMain && (
                <div className="text-palace-gold mb-2 font-medium">
                  {speaker.speaker.ministerName}跪奏道：
                </div>
              )}
              {speaker.content}
            </div>
          </div>
        </div>
      )}

      {showNextButton && (
        <div className="text-center">
          <button
            onClick={handleNextSpeaker}
            className="palace-button-gold px-6 py-2"
          >
            {currentSpeaker < discussionSequence.length - 1 ? '继续听取奏对' : '听取完毕，圣裁'}
          </button>
        </div>
      )}
    </div>
  );
}

function CourtDecisionView({
  memorial,
  gameMode,
  onMakeChoice,
  onDirectDecree
}: {
  memorial: CourtMemorial;
  gameMode: 'local' | 'llm';
  onMakeChoice: (memorial: CourtMemorial, choice: MemorialChoice) => void;
  onDirectDecree: () => void;
}) {
  const [showEffects, setShowEffects] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<MemorialChoice | null>(null);

  if (!memorial) return null;

  const handleChoice = (choice: MemorialChoice) => {
    setSelectedChoice(choice);
    setShowEffects(true);
    onMakeChoice(memorial, choice);
  };

  return (
    <div className="palace-card p-8">
      <div className="text-center mb-6">
        <div className="palace-title text-xl mb-2">皇帝圣裁</div>
        <div className="text-palace-text-muted">你端坐龙椅之上，望着殿下争论不休的群臣，深知每一个选择都将牵动天下大局。</div>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-palace-bg-light border border-palace-border flex items-center justify-center">
            <span className="text-xl font-bold">{memorial.ministerName.charAt(0)}</span>
          </div>
          <div>
            <div className="palace-title text-xl">{memorial.ministerName}</div>
            <div className="text-palace-text-muted">{memorial.ministerTitle}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center rounded-full bg-palace-bg-light px-3 py-1 border border-palace-border">
            派系：{memorial.ministerFaction}
          </span>
          <span className="inline-flex items-center rounded-full bg-palace-bg-light px-3 py-1 border border-palace-border">
            紧急：{memorial.urgencyLevel === 'urgent' ? '紧急' : memorial.urgencyLevel === 'important' ? '重要' : '普通'}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <div className="text-palace-text-muted mb-2">奏报主题</div>
        <div className="palace-title text-lg mb-4">{memorial.subject}</div>
      </div>

      {!showEffects ? (
        <div className="mb-6">
          <div className="text-palace-text-muted mb-2">请选择圣裁</div>
          <div className="space-y-3">
            {memorial.choices.map((choice: MemorialChoice) => (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice)}
                className="w-full text-left p-4 rounded border border-palace-border hover:bg-palace-bg-light transition-colors"
              >
                <div className="font-bold mb-1">{choice.text}</div>
                <div className="text-palace-text-muted text-sm">{choice.hint}</div>
              </button>
            ))}
          </div>
          {gameMode === 'llm' && (
            <div className="mt-4 p-4 rounded border border-palace-border bg-palace-bg-light">
              <div className="text-palace-text-muted text-sm mb-3">
                LLM 模式下，此处将预留"自拟圣旨"按钮入口，支持玩家直接输入想法并由大模型推理生成结果。
              </div>
              <button
                type="button"
                onClick={onDirectDecree}
                disabled
                className="w-full palace-button-muted text-sm py-2"
              >
                自拟圣旨（LLM 模式占位）
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6">
          <div className="text-palace-text-muted mb-2">圣旨已下</div>
          <div className="bg-palace-bg-light p-4 rounded border border-palace-border mb-4">
            <div className="font-bold mb-2">{selectedChoice?.text}</div>
            <div className="text-palace-text-muted">{selectedChoice?.hint}</div>
          </div>
          <div className="bg-palace-bg-light p-4 rounded border border-palace-border">
            <div className="text-palace-text-muted mb-2">效果预览</div>
            <div className="space-y-2">
              {selectedChoice?.effects.map((effect: GameEffect, index: number) => {
                const hasNewValue = 'newValue' in effect && typeof effect.newValue === 'number';
                const displayValue = hasNewValue
                  ? `=${effect.newValue}`
                  : `${effect.delta !== undefined && effect.delta >= 0 ? '+' : ''}${effect.delta ?? ''}`;
                const isPositive = hasNewValue ? effect.newValue! >= 0 : (effect.delta ?? 0) >= 0;
                return (
                  <div key={index} className="flex items-center">
                    <span className={`mr-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {displayValue}
                    </span>
                    <span>{effect.description}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CourtSummaryView({
  choiceRecords,
  onDismissCourt
}: {
  choiceRecords: ChoiceRecord[];
  onDismissCourt: () => void;
}) {
  return (
    <div className="palace-card p-8">
      <div className="palace-title text-2xl mb-6 text-center">退朝总结</div>
      <div className="mb-8">
        <div className="text-palace-text-muted mb-4">本次上朝决策汇总</div>
        <div className="space-y-4">
          {choiceRecords.map((record, index) => (
            <div key={index} className="bg-palace-bg-light p-4 rounded border border-palace-border">
              <div className="font-bold mb-2">{record.subject}</div>
              <div className="text-palace-text-muted mb-2">{record.ministerName}</div>
              <div className="mb-2">
                <span className="text-palace-text-muted">选择：</span>
                <span>{record.choiceText}</span>
              </div>
              <div>
                <span className="text-palace-text-muted">效果：</span>
                <div className="ml-4 mt-2 space-y-1">
                  {record.effects.map((effect: GameEffect, effectIndex: number) => {
                    const hasNewValue = 'newValue' in effect && typeof effect.newValue === 'number';
                    const displayValue = hasNewValue
                      ? `=${effect.newValue}`
                      : `${effect.delta !== undefined && effect.delta >= 0 ? '+' : ''}${effect.delta ?? ''}`;
                    const isPositive = hasNewValue ? effect.newValue! >= 0 : (effect.delta ?? 0) >= 0;
                    return (
                      <div key={effectIndex} className="flex items-center">
                        <span className={`mr-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {displayValue}
                        </span>
                        <span>{effect.description}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="text-center mt-8">
        <div className="text-palace-text mb-4">
          今日早朝已结束，效果已加入结算队列
        </div>
        <button
          onClick={onDismissCourt}
          className="palace-button-gold px-8 py-3 text-lg"
        >
          鸣鞭·退朝
        </button>
        <div className="text-palace-text-muted text-sm mt-4">
          退朝后效果将在回合结算时统一应用
        </div>
      </div>
    </div>
  );
}
