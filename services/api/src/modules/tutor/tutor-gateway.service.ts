import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import { TutorCitation } from './types/tutor-citation.type';

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

@Injectable()
export class TutorGatewayService {
  private readonly logger = new Logger(TutorGatewayService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateReply(request: TutorGatewayRequest): Promise<TutorGatewayReply | null> {
    const gatewayUrl = this.configService.get<string>('aiGateway.url')?.trim();
    if (!gatewayUrl) {
      return null;
    }

    const timeoutMs = this.configService.get<number>('aiGateway.timeoutMs') ?? 12000;
    const endpoint = new URL('/ai/v1/tutor/chat/stream', gatewayUrl);
    const controller = new AbortController();
    const startedAt = Date.now();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

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

      if (!response.ok) {
        this.logFailure(request, endpoint, startedAt, 'http_error', response.status);
        return null;
      }

      if (!response.body) {
        this.logFailure(request, endpoint, startedAt, 'empty_response');
        return null;
      }

      const parsed = await this.parseSseResponse(response, request, endpoint, startedAt);
      if (!parsed?.content) {
        this.logFailure(request, endpoint, startedAt, 'invalid_stream');
        return null;
      }

      return parsed;
    } catch (error: any) {
      const failureType = error?.name === 'AbortError' ? 'timeout' : 'network_error';
      this.logFailure(request, endpoint, startedAt, failureType, undefined, error);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async parseSseResponse(
    response: Response,
    request: TutorGatewayRequest,
    endpoint: URL,
    startedAt: number,
  ): Promise<TutorGatewayReply | null> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let content = '';
    let provider: string | undefined;
    const citationsByKey = new Map<string, TutorCitation>();

    const processFrame = (frame: string) => {
      const lines = frame.split(/\r?\n/);
      let eventName = 'message';
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
        return false;
      }

      let parsed: any;
      try {
        parsed = JSON.parse(data);
      } catch {
        parsed = { text: data };
      }

      if (eventName === 'delta' && typeof parsed.text === 'string') {
        content += parsed.text;
      }

      if (eventName === 'metadata') {
        if (typeof parsed.provider === 'string') {
          provider = parsed.provider;
        }

        if (Array.isArray(parsed.sources)) {
          for (const source of parsed.sources) {
            const mapped = this.mapCitation(source);
            const key = [
              mapped.sourceBook,
              mapped.classLevel ?? '',
              mapped.subject ?? '',
              mapped.chapter ?? '',
              mapped.pageNumber ?? '',
            ].join('|');
            if (!citationsByKey.has(key)) {
              citationsByKey.set(key, mapped);
            }
          }
        }
      }

      return eventName === 'done';
    };

    try {
      while (true) {
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
            const shouldStop = processFrame(frame);
            if (shouldStop) {
              await reader.cancel();
              break;
            }
          }
          frameEnd = buffer.indexOf('\n\n');
        }
      }
    } catch (error: any) {
      this.logFailure(request, endpoint, startedAt, 'invalid_stream', undefined, error);
      return null;
    } finally {
      decoder.decode();
    }

    return {
      content: content.trim(),
      citations: Array.from(citationsByKey.values()),
      provider,
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
