import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Minister } from '../../core/types';

interface MinisterChatPanelProps {
  onClose: () => void;
}

export function MinisterChatPanel({ onClose }: MinisterChatPanelProps) {
  const { gameState } = useGameStore();
  const [selectedMinister, setSelectedMinister] = useState<Minister | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const ministers = gameState?.ministers.filter(m => m.isAlive) || [];

  const handleSend = async () => {
    if (!chatInput.trim() || !selectedMinister) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsGenerating(true);

    setTimeout(() => {
      const responses = [
        `臣${selectedMinister.name}以为，${userMessage.includes('税') ? '税收之事关乎国本，需谨慎行事。' : '此事需从长计议，不可操之过急。'}`,
        `陛下圣明！${selectedMinister.name}定当竭尽全力，为陛下分忧。`,
        `依臣之见，当下之计，应当${Math.random() > 0.5 ? '开源节流' : '休养生息'}。`,
        `臣闻民间疾苦，望陛下三思。`,
        `此事臣已有所闻，容臣详查后禀报。`
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
      setIsGenerating(false);
    }, 1000 + Math.random() * 1000);
  };

  const getFactionColor = (faction: string) => {
    switch (faction) {
      case 'donglin': return 'text-blue-400';
      case 'eunuch': return 'text-red-400';
      case 'military': return 'text-green-400';
      case 'imperial': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="palace-panel w-[900px] h-[600px] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-palace-border">
          <h2 className="palace-title text-xl">召见大臣</h2>
          <button onClick={onClose} className="text-palace-text-muted hover:text-palace-text text-2xl">
            ×
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r border-palace-border overflow-y-auto palace-scrollbar">
            <div className="p-2">
              <p className="text-palace-text-muted text-xs px-2 mb-2">在朝大臣 ({ministers.length})</p>
              {ministers.map(minister => (
                <button
                  key={minister.id}
                  onClick={() => {
                    setSelectedMinister(minister);
                    setChatHistory([]);
                  }}
                  className={`w-full text-left p-3 rounded-lg mb-1 transition-all ${
                    selectedMinister?.id === minister.id
                      ? 'bg-palace-gold/20 border border-palace-gold'
                      : 'hover:bg-palace-bg-light'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-palace-text font-medium">{minister.name}</span>
                    <span className={`text-xs ${getFactionColor(minister.faction)}`}>
                      {minister.factionLabel}
                    </span>
                  </div>
                  <p className="text-palace-text-muted text-xs mt-1">{minister.title}</p>
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="text-green-400">忠{minister.loyalty}</span>
                    <span className="text-blue-400">能{minister.competence}</span>
                    <span className="text-red-400">贪{minister.corruption}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {selectedMinister ? (
              <>
                <div className="p-4 border-b border-palace-border bg-palace-bg-light/30">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-palace-gold/20 flex items-center justify-center text-2xl">
                      👤
                    </div>
                    <div>
                      <h3 className="text-palace-text font-semibold">{selectedMinister.name}</h3>
                      <p className="text-palace-text-muted text-sm">{selectedMinister.title}</p>
                    </div>
                  </div>
                  <p className="text-palace-text-muted text-xs mt-2 italic">
                    "{(selectedMinister.summary || '此人身世不详').slice(0, 60)}..."
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto palace-scrollbar p-4 space-y-4">
                  {chatHistory.length === 0 ? (
                    <div className="text-center text-palace-text-muted mt-8">
                      <p>请向 {selectedMinister.name} 提问</p>
                      <p className="text-xs mt-2">可询问政务、军情、民情等</p>
                    </div>
                  ) : (
                    chatHistory.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-palace-gold/20 text-palace-text'
                              : 'bg-palace-bg-light text-palace-text'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  {isGenerating && (
                    <div className="flex justify-start">
                      <div className="bg-palace-bg-light p-3 rounded-lg">
                        <p className="text-sm text-palace-text-muted animate-pulse">正在思考...</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-palace-border">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="输入问题..."
                      className="flex-1 palace-input"
                      disabled={isGenerating}
                    />
                    <button
                      onClick={handleSend}
                      disabled={isGenerating || !chatInput.trim()}
                      className="palace-button-gold px-6 disabled:opacity-50"
                    >
                      发送
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-palace-text-muted">
                <div className="text-center">
                  <p className="text-4xl mb-4">👥</p>
                  <p>请从左侧选择一位大臣</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
