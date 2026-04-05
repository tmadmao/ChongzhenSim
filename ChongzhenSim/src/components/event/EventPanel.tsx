import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Choice } from '../../core/types';

export function EventPanel() {
  const { gameState, applyPlayerDecision } = useGameStore();
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showEffects, setShowEffects] = useState(false);

  const currentEvent = gameState?.currentEvent;

  if (!currentEvent) {
    return (
      <div className="palace-panel h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-palace-text-muted">今日朝堂平静</p>
          <p className="text-palace-text-muted text-sm mt-2">请点击「结束回合」推进游戏</p>
        </div>
      </div>
    );
  }

  const handleChoice = (choice: Choice) => {
    setSelectedChoice(choice.id);
    setShowEffects(true);
    
    setTimeout(() => {
      applyPlayerDecision({
        type: 'event_choice',
        choiceId: choice.id,
        effects: choice.effects
      });
      setSelectedChoice(null);
      setShowEffects(false);
    }, 1500);
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'crisis': return '🚨';
      case 'warning': return '⚠️';
      case 'opportunity': return '🌟';
      default: return '📜';
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'crisis': return 'text-danger';
      case 'warning': return 'text-warning';
      case 'opportunity': return 'text-success';
      default: return 'text-palace-gold';
    }
  };

  return (
    <div className="palace-panel h-full p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getMoodIcon(currentEvent.mood)}</span>
          <h2 className={`palace-title text-xl ${getMoodColor(currentEvent.mood)}`}>
            {currentEvent.mood === 'crisis' ? '紧急军情' : 
             currentEvent.mood === 'warning' ? '朝廷警报' :
             currentEvent.mood === 'opportunity' ? '天赐良机' : '朝廷奏报'}
          </h2>
        </div>
        <span className="text-palace-text-muted text-sm">{gameState?.date}</span>
      </div>

      <div className="palace-divider mb-4" />

      <div className="flex-1 overflow-y-auto palace-scrollbar">
        <div className="prose prose-invert max-w-none">
          <p className="text-palace-text leading-relaxed whitespace-pre-wrap font-serif">
            {currentEvent.narrative}
          </p>
        </div>

        {currentEvent.immediateEffects.length > 0 && (
          <div className="mt-4 p-3 bg-palace-bg-light rounded-lg">
            <p className="text-palace-text-muted text-xs mb-2">即时影响：</p>
            <div className="space-y-1">
              {currentEvent.immediateEffects.map((effect, i) => {
                const isPositive = effect.delta > 0;
                return (
                  <p key={i} className={`text-sm ${isPositive ? 'text-success' : 'text-danger'}`}>
                    · {effect.description}
                  </p>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="palace-divider mb-4" />
        
        {showEffects && selectedChoice ? (
          <div className="space-y-2 animate-fade-in">
            <p className="text-palace-text-muted text-sm">决策生效中...</p>
            {currentEvent.choices.find(c => c.id === selectedChoice)?.effects.map((effect, i) => {
              const isPositive = effect.delta > 0;
              return (
                <p 
                  key={i} 
                  className={`text-sm ${isPositive ? 'text-success' : 'text-danger'}`}
                >
                  · {effect.description}
                </p>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {currentEvent.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice)}
                className="palace-card text-left hover:border-palace-gold transition-all group"
              >
                <p className="text-palace-text group-hover:text-palace-gold transition-colors">
                  {choice.text}
                </p>
                {choice.hint && (
                  <p className="text-palace-text-muted text-xs mt-1">
                    {choice.hint}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
