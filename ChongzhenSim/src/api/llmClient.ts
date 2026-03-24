import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { AIEventResponseSchema, type AIEventResponse } from './schemas';
import { 
  type EventContext, 
  buildUserPrompt, 
  SYSTEM_PROMPT
} from './eventContext';
import type { Minister } from '../core/types';
import { createLogger } from '../utils/logger';
import { getSettings } from '../store/settingsStore';

const logger = createLogger('LLM');

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
  private provider: ReturnType<typeof createOpenAI>;
  private modelName: string;
  private useServerProxy: boolean;

  constructor() {
    this.provider = createOpenAI({ compatibility: 'strict' });
    this.modelName = 'gpt-4o';
    this.useServerProxy = true;
    this.updateConfig();
  }

  private updateConfig() {
    const settings = getSettings();
    const llmConfig = settings.llmConfig;
    
    const apiKey = llmConfig.apiKey || 
                   import.meta.env.VITE_OPENAI_API_KEY || 
                   import.meta.env.VITE_DEEPSEEK_API_KEY ||
                   '';
    
    const baseURL = llmConfig.baseUrl || 
                    import.meta.env.VITE_OPENAI_BASE_URL || 
                    (import.meta.env.VITE_DEEPSEEK_API_KEY ? 'https://api.deepseek.com' : undefined);
    
    this.provider = createOpenAI({ 
      apiKey,
      baseURL,
      compatibility: 'strict' 
    });
    
    this.modelName = llmConfig.model || import.meta.env.VITE_MODEL_NAME || 'gpt-4o';
    this.useServerProxy = !apiKey;
  }

  private getUpdatedProvider() {
    this.updateConfig();
    return this.provider;
  }

  private getUpdatedModelName() {
    this.updateConfig();
    return this.modelName;
  }

  private getUpdatedUseServerProxy() {
    this.updateConfig();
    return this.useServerProxy;
  }

  async generateEvent(context: EventContext): Promise<AIEventResponse> {
    try {
      logger.info('Requesting LLM for event generation...');
      const provider = this.getUpdatedProvider();
      const modelName = this.getUpdatedModelName();
      const { object } = await generateObject({
        model: provider(modelName),
        schema: AIEventResponseSchema,
        system: SYSTEM_PROMPT,
        prompt: buildUserPrompt(context),
        maxRetries: 2,
      });
      
      logger.info('LLM event generation successful', { mood: object.mood });
      return object;
    } catch (error) {
      logger.error('LLM event generation failed, using fallback event', error);
      return FALLBACK_EVENT;
    }
  }

  async streamMinisterChat(
    minister: Minister,
    playerMessage: string,
    _gameContextSummary: string
  ): Promise<ReadableStream<string>> {
    logger.info('Requesting LLM for minister chat...', { minister: minister.name });
    
    const useServerProxy = this.getUpdatedUseServerProxy();
    if (useServerProxy) {
      logger.debug('Using server proxy for minister chat');
      return this.streamMinisterChatViaProxy(minister, playerMessage);
    }
    
    logger.debug('Using direct LLM for minister chat');
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
      const provider = this.getUpdatedProvider();
      const modelName = this.getUpdatedModelName();
      const result = await streamText({
        model: provider(modelName),
        system: systemPrompt,
        prompt: playerMessage,
      });
      
      logger.info('LLM minister chat response received');
      return result.textStream as unknown as ReadableStream<string>;
    } catch (error) {
      logger.error('LLM minister chat failed', error);
      const encoder = new TextEncoder();
      return new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode('臣惶恐，一时语塞，容臣稍后再奏。'));
          controller.close();
        }
      }) as unknown as ReadableStream<string>;
    }
  }

  private async streamMinisterChatViaProxy(
    minister: Minister,
    playerMessage: string
  ): Promise<ReadableStream<string>> {
    logger.debug('Sending minister chat request to server proxy');
    
    try {
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
        logger.error('Server proxy response error', { status: response.status });
        const encoder = new TextEncoder();
        return new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(encoder.encode('臣惶恐，无法回应陛下。'));
            controller.close();
          }
        }) as unknown as ReadableStream<string>;
      }

      logger.info('Server proxy response received');
      return response.body as unknown as ReadableStream<string>;
    } catch (error) {
      logger.error('Server proxy request failed', error);
      const encoder = new TextEncoder();
      return new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode('臣惶恐，无法回应陛下。'));
          controller.close();
        }
      }) as unknown as ReadableStream<string>;
    }
  }

  async generateMinisterResponse(
    minister: Minister,
    playerMessage: string,
    gameContextSummary: string
  ): Promise<string> {
    logger.debug('Generating minister response...', { minister: minister.name });
    
    const stream = await this.streamMinisterChat(minister, playerMessage, gameContextSummary);
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let result = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value as unknown as ArrayBuffer, { stream: true });
    }
    
    logger.info('Minister response generated successfully');
    return result;
  }

  isConfigured(): boolean {
    const settings = getSettings();
    const llmConfig = settings.llmConfig;
    const apiKey = llmConfig.apiKey || 
                   import.meta.env.VITE_OPENAI_API_KEY || 
                   import.meta.env.VITE_DEEPSEEK_API_KEY;
    return !!apiKey || this.getUpdatedUseServerProxy();
  }

  getConfigInfo(): { provider: string; model: string; configured: boolean } {
    const settings = getSettings();
    const llmConfig = settings.llmConfig;
    const hasOpenAI = !!import.meta.env.VITE_OPENAI_API_KEY;
    const hasDeepSeek = !!import.meta.env.VITE_DEEPSEEK_API_KEY;
    
    return {
      provider: llmConfig.provider || (hasDeepSeek ? 'DeepSeek' : (hasOpenAI ? 'OpenAI' : 'Server Proxy')),
      model: llmConfig.model || this.getUpdatedModelName(),
      configured: this.isConfigured()
    };
  }
}

export const llmClient = new LLMClient();
