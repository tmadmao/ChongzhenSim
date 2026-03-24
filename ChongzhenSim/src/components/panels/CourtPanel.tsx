import { useState, useEffect } from 'react';
import { useCourtStore } from '@/store/courtStore';
import { useGameStore } from '@/store/gameStore';
import { courtSystem } from '@/systems/courtSystem';

export function CourtPanel() {
  const { gameState } = useGameStore();
  const {
    phase,
    memorials,
    currentMemorialIndex,
    choiceRecords,
    hasCourtedThisTurn,
    initCourt,
    startOpening,
    makeChoice,
    nextMemorial,
    dismissCourt
  } = useCourtStore();

  useEffect(() => {
    const loadMemorials = async () => {
      if (gameState) {
        const memorials = await courtSystem.getMemorialsForTurn(gameState.turn, gameState);
        const sessionMeta = courtSystem.getSessionMeta(gameState.turn);
        initCourt(memorials, sessionMeta);
      }
    };
    loadMemorials();
  }, [gameState, initCourt]);

  const handleStartCourt = () => {
    startOpening();
  };

  const handleMakeChoice = async (memorial: any, choice: any) => {
    await makeChoice(memorial, choice);
  };

  const handleNextMemorial = () => {
    nextMemorial();
  };

  const handleDismissCourt = () => {
    dismissCourt();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
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
      <div className="flex-1 overflow-y-auto p-6 palace-scrollbar">
        {phase === 'closed' && <CourtEntrance onStartCourt={handleStartCourt} hasCourtedThisTurn={hasCourtedThisTurn} />}
        {phase === 'opening' && <CourtOpening />}
        {phase === 'memorial' && (
          <CourtMemorialView
            memorial={memorials[currentMemorialIndex]}
            onMakeChoice={handleMakeChoice}
            onNextMemorial={handleNextMemorial}
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
      <div className="text-palace-text-muted mb-12">
        <div className="mb-4">司礼监太监：「皇上驾到！」</div>
        <div className="mb-4">百官：「吾皇万岁万岁万万岁！」</div>
        <div>崇祯皇帝：「众爱卿平身。有事启奏，无事退朝。」</div>
      </div>
      <div className="text-palace-text-muted">
        正在准备奏报...
      </div>
    </div>
  );
}

function CourtMemorialView({ 
  memorial, 
  onMakeChoice, 
  onNextMemorial 
}: { 
  memorial: any; 
  onMakeChoice: (memorial: any, choice: any) => void; 
  onNextMemorial: () => void; 
}) {
  const [showEffects, setShowEffects] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<any>(null);

  if (!memorial) return null;

  const handleChoice = (choice: any) => {
    setSelectedChoice(choice);
    setShowEffects(true);
    onMakeChoice(memorial, choice);
  };

  const handleNext = () => {
    setShowEffects(false);
    setSelectedChoice(null);
    onNextMemorial();
  };

  return (
    <div className="palace-card p-8">
      <div className="flex items-center mb-6">
        <div className="w-16 h-16 rounded-full bg-palace-bg-light border border-palace-border flex items-center justify-center mr-4">
          <span className="text-xl font-bold">{memorial.ministerName.charAt(0)}</span>
        </div>
        <div>
          <div className="palace-title text-xl">{memorial.ministerName}</div>
          <div className="text-palace-text-muted">{memorial.ministerTitle}</div>
        </div>
      </div>

      <div className="mb-6">
          <div className="text-palace-text-muted mb-2">奏报主题</div>
          <div className="palace-title text-lg mb-4">{memorial.subject}</div>
          <div className="text-palace-text bg-palace-bg-light p-4 rounded border border-palace-border">
            {memorial.content}
          </div>
        </div>

      {!showEffects ? (
        <div className="mb-6">
          <div className="text-palace-text-muted mb-2">请选择</div>
          <div className="space-y-3">
            {memorial.choices.map((choice: any) => (
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
        </div>
      ) : (
        <div className="mb-6">
          <div className="text-palace-text-muted mb-2">选择结果</div>
          <div className="bg-palace-bg-light p-4 rounded border border-palace-border mb-4">
            <div className="font-bold mb-2">{selectedChoice?.text}</div>
            <div className="text-palace-text-muted">{selectedChoice?.hint}</div>
          </div>
          <div className="bg-palace-bg-light p-4 rounded border border-palace-border">
            <div className="text-palace-text-muted mb-2">效果</div>
            <div className="space-y-2">
              {selectedChoice?.effects.map((effect: any, index: number) => (
                <div key={index} className="flex items-center">
                  <span className={`mr-2 ${effect.delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {effect.delta > 0 ? '+' : ''}{effect.delta}
                  </span>
                  <span>{effect.description}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 text-center">
            <button
              onClick={handleNext}
              className="palace-button-gold px-6 py-2"
            >
              下一条奏报
            </button>
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
  choiceRecords: any[];
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
                  {record.effects.map((effect: any, effectIndex: number) => (
                    <div key={effectIndex} className="flex items-center">
                      <span className={`mr-2 ${effect.delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {effect.delta > 0 ? '+' : ''}{effect.delta}
                      </span>
                      <span>{effect.description}</span>
                    </div>
                  ))}
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
