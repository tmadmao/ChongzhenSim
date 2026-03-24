import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { AIEventResponseSchema, type AIEventResponse } from './schemas';
import { 
  type EventContext, 
  buildUserPrompt, 
  SYSTEM_PROMPT
} from './eventContext';
import type { Minister } from '../core/types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

const FALLBACK_EVENT: AIEventResponse = {
  narrative: '今日朝堂平静，诸事无异。皇上批阅奏折至深夜，未有大变。',
  mood: 'normal',
  choices: [
    { 
      id: 'rest', 
      text: '继续处理政务', 
      hint: '维持现状', 
      effects: [] 
    },
    { 
      id: 'inspect', 
      text: '召见大臣问询', 
      hint: '或有新情报', 
      effects: [] 
    }
  ],
  immediateEffects: [],
  ministersInvolved: []
};

export class LLMClient {
  private provider;
  private modelName: string;
  private useServerProxy: boolean;

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || 
                   import.meta.env.VITE_DEEPSEEK_API_KEY ||
                   '';
    
    const baseURL = import.meta.env.VITE_OPENAI_BASE_URL || 
                    (import.meta.env.VITE_DEEPSEEK_API_KEY ? 'https://api.deepseek.com' : undefined);
    
    this.provider = createOpenAI({ 
      apiKey,
      baseURL,
      compatibility: 'strict' 
    });
    
    this.modelName = import.meta.env.VITE_MODEL_NAME || 'gpt-4o';
    this.useServerProxy = !apiKey;
  }

  async generateEvent(context: EventContext): Promise<AIEventResponse> {
    try {
      const { object } = await generateObject({
        model: this.provider(this.modelName),
        schema: AIEventResponseSchema,
        system: SYSTEM_PROMPT,
        prompt: buildUserPrompt(context),
        maxRetries: 2,
      });
      
      console.log('[LLMClient] 生成事件成功:', object.mood);
      return object;
    } catch (error) {
      console.error('[LLMClient] generateEvent 失败，使用 fallback 事件', error);
      return FALLBACK_EVENT;
    }
  }

  async streamMinisterChat(
    minister: Minister,
    playerMessage: string,
    _gameContextSummary: string
  ): Promise<ReadableStream<string>> {
    if (this.useServerProxy) {
      return this.streamMinisterChatViaProxy(minister, playerMessage);
    }
    
    const { buildMinisterSystemPrompt } = await import('./eventContext');
    const { streamText } = await import('ai');
    
    const systemPrompt = buildMinisterSystemPrompt(
      {
        name: minister.name,
        title: minister.title,
        factionLabel: minister.factionLabel,
        competence: minister.competence,
        corruption: minister.corruption,
        loyalty: minister.loyalty
      },
      _gameContextSummary
    );

    try {
      const result = streamText({
        model: this.provider(this.modelName),
        system: systemPrompt,
        prompt: playerMessage,
      });
      
      return result.textStream as unknown as ReadableStream<string>;
    } catch (error) {
      console.error('[LLMClient] streamMinisterChat 失败', error);
      const encoder = new TextEncoder();
      return new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('臣惶恐，一时语塞，容臣稍后再奏。'));
          controller.close();
        }
      });
    }
  }

  private async streamMinisterChatViaProxy(
    minister: Minister,
    playerMessage: string
  ): Promise<ReadableStream<string>> {
    const response = await fetch(`${API_BASE}/api/minister-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ministerId: minister.id,
        ministerName: minister.name,
        ministerInfo: `${minister.title}，${minister.factionLabel}，忠诚${minister.loyalty}，能力${minister.competence}，腐败${minister.corruption}`,
        userMessage: playerMessage,
      }),
    });

    if (!response.ok) {
      const encoder = new TextEncoder();
      return new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('臣惶恐，无法回应陛下。'));
          controller.close();
        }
      });
    }

    return response.body as ReadableStream<string>;
  }

  async generateMinisterResponse(
    minister: Minister,
    playerMessage: string,
    gameContextSummary: string
  ): Promise<string> {
    const stream = await this.streamMinisterChat(minister, playerMessage, gameContextSummary);
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let result = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
    }
    
    return result;
  }

  isConfigured(): boolean {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || 
                   import.meta.env.VITE_DEEPSEEK_API_KEY;
    return !!apiKey || this.useServerProxy;
  }

  getConfigInfo(): { provider: string; model: string; configured: boolean } {
    const hasOpenAI = !!import.meta.env.VITE_OPENAI_API_KEY;
    const hasDeepSeek = !!import.meta.env.VITE_DEEPSEEK_API_KEY;
    
    return {
      provider: hasDeepSeek ? 'DeepSeek' : (hasOpenAI ? 'OpenAI' : 'Server Proxy'),
      model: this.modelName,
      configured: this.isConfigured()
    };
  }
}

export const llmClient = new LLMClient();
