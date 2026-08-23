import express, { Request, Response } from 'express';
import cors from 'cors';
import { aiGatewayPipeline } from './pipeline';
import { providerRegistry } from './providers/provider.registry';
import { authenticateStudent, AuthenticatedRequest } from './middleware/auth.middleware';
import { SseStreamHandler } from './sse/sse.handler';

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Shikkhok AI Gateway', timestamp: new Date() });
});

// SSE Streaming AI Tutor Endpoint via Central Provider Abstraction & Standardized SSE Protocol
app.post('/ai/v1/tutor/chat/stream', authenticateStudent, async (req: AuthenticatedRequest, res: Response) => {
  const { conversationId, message, prompt, lessonId, topicId, language = 'bn', provider = 'gemini' } = req.body;
  const userPrompt = message || prompt || '';
  const authenticatedStudentId = req.user?.studentId;

  const sse = new SseStreamHandler(res);

  if (!userPrompt) {
    sse.emitError({
      code: 'BAD_REQUEST',
      message: 'Message or prompt is required',
      banglaMessage: 'বার্তা বা প্রম্পট প্রদান করা আবশ্যক',
    });
    return sse.finish();
  }

  // 1. Safety Check
  const safety = aiGatewayPipeline.performSafetyCheck(userPrompt);
  if (!safety.safe) {
    sse.emitError({
      code: 'SAFETY_CHECK_FAILED',
      message: safety.reason || 'Safety check failed',
      banglaMessage: 'প্রম্পটটি কন্টেন্ট ফিল্টারে ফ্ল্যাগ করা হয়েছে',
    });
    return sse.finish();
  }

  // 2. Resolve Provider
  const activeProvider = providerRegistry.getProvider(provider);
  res.setHeader('X-Shikkhok-Provider', activeProvider.name);

  let fullResponseText = '';
  const timeoutMs = 15000; // 15s provider timeout guard

  try {
    const streamPromise = (async () => {
      const stream = activeProvider.streamChat({
        messages: [{ role: 'user', content: userPrompt }],
        topicId,
        model: req.body.model,
      });

      for await (const chunk of stream) {
        if (!sse.isConnected()) {
          console.log(`[AI Gateway SSE] Client disconnected/cancelled request for conversation ${conversationId}`);
          break;
        }
        fullResponseText += chunk;
        sse.emitDelta(chunk);
      }
    })();

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('PROVIDER_TIMEOUT')), timeoutMs);
    });

    await Promise.race([streamPromise, timeoutPromise]);
  } catch (err: any) {
    if (err.message === 'PROVIDER_TIMEOUT') {
      console.error('[AI Gateway SSE] Provider timed out after 15s');
      sse.emitError({
        code: 'PROVIDER_TIMEOUT',
        message: 'LLM provider request timed out',
        banglaMessage: 'এআই টিউটর প্রতিক্রিয়া প্রদানে সময় পেরিয়ে গেছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
      });
    } else {
      console.error('[AI Gateway SSE Error]:', err);
      sse.emitError({
        code: 'PROVIDER_FAILURE',
        message: 'LLM provider failed to generate response',
        banglaMessage: 'এআই টিউটর সার্ভিস সাময়িকভাবে ব্যাহত হয়েছে।',
      });
    }
  }

  if (sse.isConnected()) {
    // 3. Emit structured metadata event
    const usage = aiGatewayPipeline.calculateUsage(userPrompt, fullResponseText);
    sse.emitMetadata({
      studentId: authenticatedStudentId,
      conversationId: conversationId || 'conv-' + Date.now(),
      lessonId,
      topicId,
      provider: activeProvider.name,
      ...usage,
    });

    // 4. Emit standard done event
    sse.finish();
  }
});



app.listen(PORT, () => {
  console.log(`🤖 Shikkhok AI Gateway running on http://localhost:${PORT}`);
});


