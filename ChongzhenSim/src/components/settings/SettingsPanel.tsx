import React, { useState } from 'react';
import { Settings, Save, Trash2, Sun, Moon, X } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { useThemeStore } from '../../store/themeStore';
import { useGameStore } from '../../store/gameStore';

interface SettingsPanelProps {
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const { 
    theme, 
    gameMode, 
    llmConfig, 
    setTheme, 
    setGameMode, 
    setLLMConfig 
  } = useSettingsStore();
  
  const { toggleTheme: toggleThemeStore } = useThemeStore();
  const { resetGame } = useGameStore();
  
  const [localLLMConfig, setLocalLLMConfig] = useState(llmConfig);

  const handleSaveSettings = () => {
    setLLMConfig(localLLMConfig);
    alert('设置已保存');
  };

  const handleSaveGame = () => {
    // 这里可以添加保存游戏的逻辑
    alert('游戏已保存');
  };

  const handleDeleteSave = () => {
    if (window.confirm('确定要删除存档并重新开始吗？')) {
      resetGame();
      onClose();
    }
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    toggleThemeStore();
  };

  return (
    <div className="palace-modal-overlay">
      <div className="palace-modal max-h-[80vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="flex justify-between items-center mb-6 border-b border-palace-border pb-4">
          <div className="flex items-center gap-2">
            <Settings className="text-palace-gold" size={24} />
            <h2 className="text-xl font-bold text-palace-text">游戏设置</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-palace-text-muted hover:text-palace-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 存档管理 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-palace-text mb-3">存档管理</h3>
          <div className="flex gap-3">
            <button 
              onClick={handleSaveGame}
              className="flex-1 palace-button-gold flex items-center justify-center gap-2"
            >
              <Save size={16} />
              <span>保存当前进度</span>
            </button>
            <button 
              onClick={handleDeleteSave}
              className="flex-1 palace-button-outline flex items-center justify-center gap-2 text-danger"
            >
              <Trash2 size={16} />
              <span>删除存档</span>
            </button>
          </div>
        </div>

        {/* 模式切换 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-palace-text mb-3">游戏模式</h3>
          <div className="flex items-center justify-between">
            <span className="text-palace-text">本地模式</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={gameMode === 'llm'}
                onChange={(e) => setGameMode(e.target.checked ? 'llm' : 'local')}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-palace-gold"></div>
            </label>
            <span className="text-palace-text">LLM 模式</span>
          </div>
        </div>

        {/* LLM 配置 */}
        {gameMode === 'llm' && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-palace-text mb-3">LLM 配置</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-palace-text-muted mb-1">API Key</label>
                <input 
                  type="password"
                  value={localLLMConfig.apiKey}
                  onChange={(e) => setLocalLLMConfig({ ...localLLMConfig, apiKey: e.target.value })}
                  className="w-full palace-input"
                  placeholder="输入 API Key"
                />
              </div>
              <div>
                <label className="block text-palace-text-muted mb-1">自定义 Endpoint</label>
                <input 
                  type="text"
                  value={localLLMConfig.baseUrl}
                  onChange={(e) => setLocalLLMConfig({ ...localLLMConfig, baseUrl: e.target.value })}
                  className="w-full palace-input"
                  placeholder="https://api.openai.com/v1"
                />
              </div>
              <div>
                <label className="block text-palace-text-muted mb-1">模型名称</label>
                <input 
                  type="text"
                  value={localLLMConfig.model}
                  onChange={(e) => setLocalLLMConfig({ ...localLLMConfig, model: e.target.value })}
                  className="w-full palace-input"
                  placeholder="gpt-4o"
                />
              </div>
              <button 
                onClick={handleSaveSettings}
                className="w-full palace-button-gold"
              >
                保存 LLM 配置
              </button>
            </div>
          </div>
        )}

        {/* 主题选择 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-palace-text mb-3">主题选择</h3>
          <button 
            onClick={handleThemeToggle}
            className="w-full palace-button-outline flex items-center justify-center gap-2"
          >
            {theme === 'dark' ? (
              <>
                <Sun size={16} />
                <span>切换到白色简约主题</span>
              </>
            ) : (
              <>
                <Moon size={16} />
                <span>切换到华贵暗金主题</span>
              </>
            )}
          </button>
        </div>

        {/* 关闭按钮 */}
        <button 
          onClick={onClose}
          className="w-full palace-button-outline"
        >
          关闭
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel;
