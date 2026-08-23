import express, { Request, Response } from 'express';
import cors from 'cors';
import { aiGatewayPipeline } from './pipeline';
import { providerRegistry } from './providers/provider.registry';
import { authenticateStudent, AuthenticatedRequest } from './middleware/auth.middleware';

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Shikkhok AI Gateway', timestamp: new Date() });
});

// SSE Streaming AI Tutor Endpoint via Central Provider Abstraction & Authenticated Context
app.post('/ai/v1/tutor/chat/stream', authenticateStudent, async (req: AuthenticatedRequest, res: Response) => {
  const { conversationId, message, prompt, lessonId, topicId, language = 'bn', provider = 'gemini' } = req.body;
  const userPrompt = message || prompt || '';

  // Extract Student Identity strictly from authenticated server context (Never trust req.body studentId)
  const authenticatedStudentId = req.user?.studentId;

  if (!userPrompt) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Message or prompt is required' });
  }

  // 1. Safety Check
  const safety = aiGatewayPipeline.performSafetyCheck(userPrompt);
  if (!safety.safe) {
    return res.status(400).json({ error: 'Safety Check Failed', reason: safety.reason });
  }

  // 2. Resolve Provider via LLMProvider Abstraction
  const activeProvider = providerRegistry.getProvider(provider);

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Shikkhok-Provider', activeProvider.name);

  let fullResponseText = '';

  try {
    const stream = activeProvider.streamChat({
      messages: [{ role: 'user', content: userPrompt }],
      topicId,
      model: req.body.model,
    });

    for await (const chunk of stream) {
      fullResponseText += chunk;
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }
  } catch (err: any) {
    console.error('[AI Gateway Stream Error]:', err);
    res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
  }

  // Usage Accounting linked to authenticated student identity
  const usage = aiGatewayPipeline.calculateUsage(userPrompt, fullResponseText);
  console.log(
    `[AI Gateway Accounting] Student: ${authenticatedStudentId} | Conversation: ${conversationId || 'new'} | Provider: ${activeProvider.name} | Tokens: ${usage.totalTokens}`
  );

  res.write(`data: ${JSON.stringify({ type: 'usage', studentId: authenticatedStudentId, conversationId, ...usage })}\n\n`);
  res.write('data: [DONE]\n\n');
  res.end();
});


app.listen(PORT, () => {
  console.log(`🤖 Shikkhok AI Gateway running on http://localhost:${PORT}`);
});


