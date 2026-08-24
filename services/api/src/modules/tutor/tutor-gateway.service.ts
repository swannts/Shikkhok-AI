import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import { TutorCitation } from './types/tutor-citation.type';
import { AiModerationService } from './services/ai-moderation.service';

export interface TutorGatewayReply {
  content: string;
  citations: TutorCitation[];
  provider?: string;
}

export interface TutorGatewayRequest {
  conversationId?: string;
  requestId?: string;
  userId: string;
  prompt: string;
  lessonId?: string | null;
  topicId?: string | null;
  classLevel: number;
  subject?: string;
  language?: string;
  medium?: string;
  provider?: string;
  contextSegments?: string[];
}

export interface TutorStreamEvent {
  event: 'metadata' | 'delta' | 'citation' | 'done' | 'error';
  data: Record<string, any>;
}

@Injectable()
export class TutorGatewayService {
  private readonly logger = new Logger(TutorGatewayService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly moderationService: AiModerationService,
  ) {}

  async generateReply(request: TutorGatewayRequest): Promise<TutorGatewayReply | null> {
    let content = '';
    const citations: TutorCitation[] = [];
    let provider: string | undefined;

    try {
      for await (const chunk of this.streamReply(request)) {
        if (chunk.event === 'metadata' && chunk.data?.provider) {
          provider = chunk.data.provider;
        } else if (chunk.event === 'delta' && typeof chunk.data?.text === 'string') {
          content += chunk.data.text;
        } else if (chunk.event === 'citation' && chunk.data) {
          citations.push(chunk.data as TutorCitation);
        }
      }

      if (!content.trim()) {
        return null;
      }

      return {
        content: content.trim(),
        citations,
        provider,
      };
    } catch {
      return null;
    }
  }

  async *streamReply(
    request: TutorGatewayRequest,
    abortSignal?: AbortSignal,
  ): AsyncIterable<TutorStreamEvent> {
    const moderation = this.moderationService.moderatePrompt(request.prompt);
    if (!moderation.isSafe) {
      yield {
        event: 'metadata',
        data: {
          provider: 'safety-guardrail',
          model: 'shikkhok-moderation-v1',
          conversationId: request.conversationId,
        },
      };
      yield {
        event: 'delta',
        data: { text: moderation.safeResponseBn ?? 'বিষয়টি অনুমোদিত নয়।' },
      };
      yield {
        event: 'done',
        data: { latencyMs: 10 },
      };
      return;
    }

    const gatewayUrl = this.configService.get<string>('aiGateway.url')?.trim();

    // If no AI Gateway URL is configured, fall back to local educational stream generator
    if (!gatewayUrl) {
      yield* this.generateLocalFallbackStream(request);
      return;
    }

    const timeoutMs = this.configService.get<number>('aiGateway.timeoutMs') ?? 15000;
    const endpoint = new URL('/ai/v1/tutor/chat/stream', gatewayUrl);
    const controller = new AbortController();
    const startedAt = Date.now();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    if (abortSignal) {
      abortSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const contextText = request.contextSegments?.length
      ? request.contextSegments.map((segment) => `- ${segment}`).join('\n')
      : 'প্রাসঙ্গিক অতিরিক্ত প্রসঙ্গ নেই।';

    const composedPrompt = [
      'তুমি Shikkhok AI, একজন বন্ধুসুলভ বাংলা-প্রথম টিউটর।',
      `শ্রেণি: ${request.classLevel}`,
      request.subject ? `বিষয়: ${request.subject}` : null,
      request.medium ? `মাধ্যম: ${request.medium}` : null,
      request.lessonId ? `পাঠ আইডি: ${request.lessonId}` : null,
      request.topicId ? `টপিক আইডি: ${request.topicId}` : null,
      'প্রসঙ্গ:',
      contextText,
      'ছাত্রের প্রশ্ন:',
      request.prompt.trim(),
      'উত্তরটি সংক্ষিপ্ত, নির্ভুল, এবং উৎসভিত্তিক দাও।',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          conversationId: request.conversationId,
          requestId: request.requestId,
          message: composedPrompt,
          prompt: composedPrompt,
          lessonId: request.lessonId ?? undefined,
          topicId: request.topicId ?? undefined,
          classLevel: `Class ${request.classLevel}`,
          subject: request.subject ?? 'General Studies',
          language: request.language ?? 'bn',
          provider: request.provider ?? 'gemini',
          userId: request.userId,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        this.logFailure(request, endpoint, startedAt, 'http_error', response.status);
        yield* this.generateLocalFallbackStream(request);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      yield {
        event: 'metadata',
        data: {
          provider: request.provider ?? 'gemini',
          model: 'gemini-1.5-pro',
          conversationId: request.conversationId,
          classLevel: request.classLevel,
          subject: request.subject,
        },
      };

      while (true) {
        if (controller.signal.aborted || abortSignal?.aborted) {
          break;
        }

        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        let frameEnd = buffer.indexOf('\n\n');

        while (frameEnd !== -1) {
          const frame = buffer.slice(0, frameEnd).trim();
          buffer = buffer.slice(frameEnd + 2);

          if (frame) {
            const event = this.parseFrame(frame);
            if (event) {
              yield event;
              if (event.event === 'done') {
                await reader.cancel().catch(() => {});
                return;
              }
            }
          }
          frameEnd = buffer.indexOf('\n\n');
        }
      }

      yield {
        event: 'done',
        data: {
          latencyMs: Date.now() - startedAt,
        },
      };
    } catch (error: any) {
      const failureType = error?.name === 'AbortError' ? 'timeout' : 'network_error';
      this.logFailure(request, endpoint, startedAt, failureType, undefined, error);
      yield* this.generateLocalFallbackStream(request);
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseFrame(frame: string): TutorStreamEvent | null {
    const lines = frame.split(/\r?\n/);
    let eventName = 'delta';
    let data = '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventName = line.slice('event:'.length).trim();
        continue;
      }

      if (line.startsWith('data:')) {
        data += line.slice('data:'.length).trim();
      }
    }

    if (!data) {
      return null;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(data);
    } catch {
      parsed = { text: data };
    }

    if (eventName === 'delta') {
      return { event: 'delta', data: { text: parsed?.text ?? data } };
    }

    if (eventName === 'metadata') {
      return { event: 'metadata', data: parsed };
    }

    if (eventName === 'citation') {
      return { event: 'citation', data: this.mapCitation(parsed) };
    }

    if (eventName === 'done') {
      return { event: 'done', data: parsed };
    }

    if (eventName === 'error') {
      return { event: 'error', data: parsed };
    }

    return { event: 'delta', data: { text: data } };
  }

  private async *generateLocalFallbackStream(
    request: TutorGatewayRequest,
  ): AsyncIterable<TutorStreamEvent> {
    const startedAt = Date.now();

    yield {
      event: 'metadata',
      data: {
        provider: 'shikkhok-local-engine',
        model: 'nctb-curriculum-v1',
        conversationId: request.conversationId,
        classLevel: request.classLevel,
        subject: request.subject ?? 'General Studies',
      },
    };

    if (request.lessonId) {
      const citation: TutorCitation = {
        sourceId: request.lessonId,
        sourceBook: `NCTB Class ${request.classLevel} ${request.subject ?? 'Textbook'}`,
        classLevel: request.classLevel,
        subject: request.subject,
        excerpt: 'এনসিটিবি পাঠ্যক্রম ভিত্তিক মূল শিক্ষণীয় বিষয়সমূহ।',
      };
      yield {
        event: 'citation',
        data: citation,
      };
    }

    const sentences = [
      'ঠিক আছে! ',
      'আমি বিষয়টি তোমাকে ধাপে ধাপে বুঝিয়ে দিচ্ছি। ',
      request.contextSegments?.length ? `${request.contextSegments.join(' • ')}। ` : '',
      `তোমার প্রশ্নের মূল ধারণা: "${request.prompt.trim()}"। `,
      'প্রথমত, সূত্র বা মূল সংজ্ঞাটি ভালো করে মনে রাখতে হবে। ',
      'দ্বিতীয়ত, বাস্তব জীবনের সহজ উদাহরণ দিয়ে চর্চা করলে বিষয়টি দীর্ঘস্থায়ী হবে। ',
      'কোনো নির্দিষ্ট অংশ বুঝতে না পারলে আমাকে নির্দ্বিধায় বলো!',
    ];

    for (const sentence of sentences) {
      if (!sentence) continue;
      // Yield token / phrase deltas
      yield {
        event: 'delta',
        data: { text: sentence },
      };
    }

    yield {
      event: 'done',
      data: {
        latencyMs: Date.now() - startedAt,
      },
    };
  }

  private mapCitation(source: any): TutorCitation {
    return {
      sourceId: source?.sourceId ?? source?.id ?? undefined,
      sourceBook: source?.sourceBook ?? source?.book ?? 'Unknown source',
      classLevel: this.extractClassLevel(source?.class),
      subject: source?.subject ?? undefined,
      chapter: source?.chapter ?? undefined,
      pageNumber: typeof source?.pageNumber === 'number' ? source.pageNumber : undefined,
      excerpt: source?.excerpt ?? source?.content ?? undefined,
      sourceUrl: source?.sourceUrl ?? undefined,
    };
  }

  private extractClassLevel(value: unknown): number | undefined {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const match = value.match(/(\d{1,2})/);
      return match ? Number(match[1]) : undefined;
    }

    return undefined;
  }

  private logFailure(
    request: TutorGatewayRequest,
    endpoint: URL,
    startedAt: number,
    failureType: string,
    statusCode?: number,
    error?: unknown,
  ) {
    this.logger.warn(
      JSON.stringify({
        event: 'tutor_gateway_failure',
        failureType,
        conversationId: request.conversationId,
        requestId: request.requestId,
        endpointHost: endpoint.host,
        latencyMs: Date.now() - startedAt,
        statusCode,
        errorName: error instanceof Error ? error.name : undefined,
      }),
    );
  }
}
