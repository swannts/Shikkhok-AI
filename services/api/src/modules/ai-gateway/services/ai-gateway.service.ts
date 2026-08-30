import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HmacSignerService } from './hmac-signer.service';

export interface TutorGenerationPayload {
  requestId: string;
  userId: string;
  conversationId: string;
  message: string;
  language?: 'bn' | 'en';
  classLevel?: number;
  subjectId?: string | null;
  chapterId?: string | null;
  lessonId?: string | null;
  subjectTitle?: string | null;
  chapterTitle?: string | null;
  lessonTitle?: string | null;
  history?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
}

export interface TutorStreamEvent {
  event: 'metadata' | 'delta' | 'citation' | 'done' | 'error';
  data: Record<string, any>;
}

@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly hmacSignerService: HmacSignerService,
  ) {}

  /**
   * Indicates if the external FastAPI AI Service is enabled.
   */
  isServiceEnabled(): boolean {
    return this.configService.get<boolean>('aiService.enabled') ?? false;
  }

  /**
   * Checks health of the FastAPI AI Service.
   */
  async healthCheck(): Promise<boolean> {
    const baseUrl = this.configService.get<string>('aiService.baseUrl')?.replace(/\/+$/, '');
    if (!baseUrl) return false;

    try {
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Streams AI Tutor response from FastAPI via signed SSE connection.
   */
  async *streamTutorResponse(
    payload: TutorGenerationPayload,
    abortSignal?: AbortSignal,
  ): AsyncIterable<TutorStreamEvent> {
    const baseUrl = (
      this.configService.get<string>('aiService.baseUrl') || 'http://localhost:8000/api/v1'
    ).replace(/\/+$/, '');
    const timeoutMs = this.configService.get<number>('aiService.timeoutMs') ?? 25000;

    // FastAPI endpoint is /api/v1/tutor/stream
    const url = new URL(`${baseUrl}/tutor/stream`);
    const path = url.pathname;

    const requestBody = JSON.stringify({
      request_id: payload.requestId,
      user_id: payload.userId,
      conversation_id: payload.conversationId,
      message: payload.message,
      language: payload.language ?? 'bn',
      class_level: payload.classLevel,
      subject_id: payload.subjectId ?? undefined,
      chapter_id: payload.chapterId ?? undefined,
      lesson_id: payload.lessonId ?? undefined,
      subject_title: payload.subjectTitle ?? undefined,
      chapter_title: payload.chapterTitle ?? undefined,
      lesson_title: payload.lessonTitle ?? undefined,
      history: payload.history ?? [],
    });

    const signedHeaders = this.hmacSignerService.generateSignedHeaders(
      'POST',
      path,
      requestBody,
      payload.requestId,
    );

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    if (abortSignal) {
      abortSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...signedHeaders,
        },
        body: requestBody,
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`FastAPI AI Service HTTP error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        if (controller.signal.aborted || abortSignal?.aborted) {
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const rawChunk of lines) {
          const parsedEvent = this.parseSseChunk(rawChunk);
          if (parsedEvent) {
            yield parsedEvent;
          }
        }
      }

      if (buffer.trim().length > 0) {
        const parsedEvent = this.parseSseChunk(buffer);
        if (parsedEvent) {
          yield parsedEvent;
        }
      }
    } catch (err: any) {
      this.logger.warn(`FastAPI stream error for req ${payload.requestId}: ${err?.message}`);
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseSseChunk(chunk: string): TutorStreamEvent | null {
    const trimmed = chunk.trim();
    if (!trimmed) return null;

    let eventName: TutorStreamEvent['event'] = 'delta';
    let dataStr = '';

    for (const line of trimmed.split('\n')) {
      if (line.startsWith('event:')) {
        const name = line.slice('event:'.length).trim();
        if (['metadata', 'delta', 'citation', 'done', 'error'].includes(name)) {
          eventName = name as TutorStreamEvent['event'];
        }
      } else if (line.startsWith('data:')) {
        dataStr += line.slice('data:'.length).trim();
      }
    }

    if (!dataStr) return null;

    let parsedData: any;
    try {
      parsedData = JSON.parse(dataStr);
    } catch {
      parsedData = { text: dataStr };
    }

    return {
      event: eventName,
      data: parsedData,
    };
  }
}
