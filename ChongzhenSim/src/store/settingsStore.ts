import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameSettings } from '../api/schemas';

interface SettingsStore extends GameSettings {
  // Actions
  setTheme: (theme: 'dark' | 'light') => void;
  setGameMode: (mode: 'local' | 'llm') => void;
  setLLMConfig: (config: GameSettings['llmConfig']) => void;
  resetSettings: () => void;
}

const defaultLLMConfig: GameSettings['llmConfig'] = {
  provider: 'OpenAI',
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o'
};

const defaultSettings: GameSettings = {
  theme: 'dark',
  gameMode: 'local',
  llmConfig: defaultLLMConfig
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setTheme: (theme) => {
        set({ theme });
      },

      setGameMode: (gameMode) => {
        set({ gameMode });
      },

      setLLMConfig: (llmConfig) => {
        set({ llmConfig });
      },

      resetSettings: () => {
        set(defaultSettings);
      }
    }),
    {
      name: 'chongzhensim-settings'
    }
  )
);

export function getSettings(): GameSettings {
  const savedSettings = localStorage.getItem('chongzhensim-settings');
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      return parsed.state || defaultSettings;
    } catch {
      return defaultSettings;
    }
  }
  return defaultSettings;
}
