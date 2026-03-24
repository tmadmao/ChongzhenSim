import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { eventBus } from '../../core/eventBus';
import { changeQueue } from '../../engine/ChangeQueue';
import { resolveEffectValue } from '../../config/gameConfig';
import { createLogger } from '../../utils/logger';
import type { ScriptedEvent, EventPriority } from '../../data/scenario/scriptedEvents';
import type { OptionEffect } from '../../api/schemas';

const logger = createLogger('ScenarioEventPanel');

export function ScenarioEventPanel({ isVisible }: { isVisible: boolean }) {
  const { gameState, applyPlayerDecision } = useGameStore();
  const [activeEvent, setActiveEvent] = useState<ScriptedEvent | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showEffects, setShowEffects] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const handleEventTriggered = (data: unknown) => {
      const event = data as ScriptedEvent;
      if (!event || !event.description) {
        console.warn('Invalid event data received:', data);
        return;
      }
      setActiveEvent(event);
      setDisplayText('');
      setIsTyping(true);

      // 打字机效果
      let index = 0;
      const typingInterval = setInterval(() => {
        if (index < event.description.length) {
          setDisplayText(event.description.substring(0, index + 1));
          index++;
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
        }
      }, 30);

      return () => clearInterval(typingInterval);
    };

    eventBus.on('event:triggered', handleEventTriggered);
    return () => eventBus.off('event:triggered', handleEventTriggered);
  }, []);

  if (!isVisible || !activeEvent) {
    return null;
  }

  /**
   * 将 OptionEffect 转换为 ChangeQueue 请求并入队
   */
  const enqueueEffects = (effects: OptionEffect[], source: string): void => {
    for (const effect of effects) {
      // 解析数值：优先使用 configKey，否则使用 value
      const resolvedValue = resolveEffectValue(
        effect.configKey as keyof typeof import('../../config/gameConfig').GAME_CONFIG.EVENT_CONSTANTS | undefined,
        effect.value
      );

      // 根据 mode 计算 delta 或 newValue
      let delta: number | undefined;
      let newValue: number | undefined;

      if (effect.mode === 'delta') {
        delta = resolvedValue;
      } else {
        newValue = resolvedValue;
      }

      // 确定 ChangeType
      let changeType: import('../../engine/ChangeQueue').ChangeType;
      switch (effect.type) {
        case 'treasury':
          changeType = 'treasury';
          break;
        case 'province':
          changeType = 'province';
          break;
        case 'minister':
        case 'official':
          changeType = 'official';
          break;
        case 'nation':
          changeType = 'nation';
          break;
        case 'faction':
          changeType = 'faction';
          break;
        default:
          changeType = 'event';
      }

      // 构建描述
      const valueStr = effect.mode === 'delta'
        ? `${resolvedValue >= 0 ? '+' : ''}${resolvedValue}`
        : `=${resolvedValue}`;
      const description = `${effect.description} (${valueStr})`;

      // 入队
      changeQueue.enqueue({
        type: changeType,
        target: effect.target,
        field: effect.field,
        delta,
        newValue,
        description,
        source
      });

      // 打印入队日志
      logger.info(`[Queue] 来自${source}，${effect.type}.${effect.field} 预计 ${valueStr}`);
      console.log(`[Queue] 来自${source}，${effect.type}.${effect.field} 预计 ${valueStr}`);
    }
  };

  const handleChoice = (choiceId: string) => {
    setSelectedChoice(choiceId);
    setShowEffects(true);

    const selectedChoiceData = activeEvent.choices.find(c => c.id === choiceId);
    if (!selectedChoiceData) {
      console.error('Selected choice not found:', choiceId);
      return;
    }

    // 显示效果预览（仅用于UI展示，实际入队在 applyPlayerDecision 中处理）
    const effects: OptionEffect[] = selectedChoiceData.effects.map(e => ({
      type: e.type as OptionEffect['type'],
      target: e.target,
      field: e.field,
      // 支持新旧两种格式
      value: 'delta' in e ? e.delta : 'value' in e ? e.value : undefined,
      configKey: 'configKey' in e ? e.configKey : undefined,
      mode: ('mode' in e ? e.mode : 'delta') as 'delta' | 'absolute',
      description: e.description
    }));

    // 注意：效果入队在 applyPlayerDecision 中统一处理，避免重复入队
    console.log(`[ScenarioEventPanel] 选择选项: ${choiceId}, 效果数: ${effects.length}`);

    setTimeout(() => {
      applyPlayerDecision({
        type: 'event_choice',
        eventId: activeEvent.id,
        choiceId,
        effects: selectedChoiceData.effects
      });
      setSelectedChoice(null);
      setShowEffects(false);
      setActiveEvent(null);
    }, 2000);
  };

  const getPriorityLabel = (priority: EventPriority) => {
    switch (priority) {
      case 'urgent': return '⚠ 紧急';
      case 'important': return '! 重要';
      case 'normal': return '· 事件';
      default: return '· 事件';
    }
  };

  const getPriorityColor = (priority: EventPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-danger text-white';
      case 'important': return 'bg-warning text-white';
      case 'normal': return 'bg-palace-gold text-palace-bg';
      default: return 'bg-palace-gold text-palace-bg';
    }
  };

  const selectedChoiceData = activeEvent.choices.find(c => c.id === selectedChoice);

  // 获取效果的显示值
  const getEffectDisplayValue = (effect: OptionEffect): string => {
    const resolvedValue = resolveEffectValue(
      effect.configKey as keyof typeof import('../../config/gameConfig').GAME_CONFIG.EVENT_CONSTANTS | undefined,
      effect.value
    );
    const prefix = effect.mode === 'delta'
      ? (resolvedValue >= 0 ? '+' : '')
      : '=';
    return `${prefix}${resolvedValue}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="w-4/5 max-w-3xl bg-palace-bg border-4 border-palace-gold rounded-lg overflow-hidden shadow-2xl">
        {/* 顶部金色标题栏 */}
        <div className="bg-gradient-to-r from-palace-gold-dark to-palace-gold p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(activeEvent.priority)}`}>
              {getPriorityLabel(activeEvent.priority)}
            </span>
            <h2 className="text-xl font-bold text-white">{activeEvent.title}</h2>
          </div>
          <span className="text-white text-sm">{gameState?.date || '崇祯元年正月 · 早朝'}</span>
        </div>

        {/* 中部文字区 */}
        <div className="p-6 bg-palace-bg-light min-h-64 max-h-96 overflow-y-auto">
          <p className="text-palace-text leading-relaxed whitespace-pre-wrap font-serif text-lg">
            {displayText}
            {isTyping && <span className="animate-pulse">|</span>}
          </p>
        </div>

        {/* 底部选项区 */}
        <div className="p-4 bg-palace-bg border-t border-palace-border">
          {showEffects && selectedChoiceData ? (
            <div className="space-y-2 animate-fade-in">
              <p className="text-palace-text-muted text-sm">效果预览（已加入结算队列）：</p>
              <div className="grid grid-cols-1 gap-2">
                {selectedChoiceData.effects.map((effect, i) => {
                  const displayValue = getEffectDisplayValue(effect as OptionEffect);
                  const isPositive = displayValue.startsWith('+') || (displayValue.startsWith('=') && parseFloat(displayValue.slice(1)) > 0);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className={isPositive ? 'text-success' : 'text-danger'}>
                        {displayValue}
                      </span>
                      <span className="text-palace-text">{effect.description}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-palace-text-muted text-xs mt-2">
                * 效果将在回合结算时统一应用
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 justify-center">
              {activeEvent.choices.map((choice) => (
                <div key={choice.id} className="relative group">
                  <button
                    onClick={() => handleChoice(choice.id)}
                    className="px-6 py-3 bg-palace-bg-light border border-palace-border rounded-lg hover:border-palace-gold hover:bg-palace-bg transition-all"
                  >
                    <span className="text-palace-text group-hover:text-palace-gold transition-colors">
                      {choice.text}
                    </span>
                  </button>
                  {choice.hint && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-palace-bg-light border border-palace-border rounded-lg text-sm text-palace-text-muted whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      {choice.hint}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
