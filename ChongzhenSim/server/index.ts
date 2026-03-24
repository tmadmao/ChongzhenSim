import express from 'express';
import cors from 'cors';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
}));
app.use(express.json());

const SYSTEM_PROMPT = `你是明朝崇祯年间的朝廷大臣，正在与皇帝对话。
回答要求：
1. 使用文言文风格，语言简洁有力
2. 体现你的政治立场和派系属性
3. 根据你的忠诚度、能力和腐败度调整回答态度
4. 回答长度控制在100-200字
5. 可以适当引用典故或历史事件`;

function getProvider() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('No API key configured. Set OPENAI_API_KEY or DEEPSEEK_API_KEY');
  }
  
  const useDeepSeek = !!process.env.DEEPSEEK_API_KEY && !process.env.OPENAI_API_KEY;
  
  return createOpenAI({
    apiKey,
    baseURL: useDeepSeek ? 'https://api.deepseek.com/v1' : undefined,
  });
}

app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    hasApiKey: !!(process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY)
  });
});

app.post('/api/minister-chat', async (req, res) => {
  try {
    const { ministerName, ministerInfo, userMessage, chatHistory } = req.body;
    
    if (!userMessage) {
      return res.status(400).json({ error: 'Missing userMessage' });
    }

    const provider = getProvider();
    const model = process.env.OPENAI_API_KEY ? 'gpt-4o-mini' : 'deepseek-chat';
    
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: `你是${ministerName || '大臣'}，${ministerInfo || '朝廷命官'}` },
      ...(chatHistory || []).map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    const result = streamText({
      model: provider(model),
      messages,
      maxTokens: 500,
    });

    result.pipeDataStreamToResponse(res);
  } catch (error) {
    console.error('[Server] Minister chat error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`[Server] Chongzhen Simulator API running on http://localhost:${PORT}`);
  console.log(`[Server] Health: http://localhost:${PORT}/api/health`);
  console.log(`[Server] API Key configured: ${!!(process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY)}`);
});
