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

    const connectionTimeoutMs =
      this.configService.get<number>('aiService.connectionTimeoutMs') ?? 5000;
    const firstTokenTimeoutMs =
      this.configService.get<number>('aiService.firstTokenTimeoutMs') ?? 15000;
    const idleTimeoutMs = this.configService.get<number>('aiService.idleTimeoutMs') ?? 20000;
    const maxGenerationTimeoutMs =
      this.configService.get<number>('aiService.maxGenerationTimeoutMs') ?? 120000;

    const controller = new AbortController();
    let connectionTimer: NodeJS.Timeout | null = null;
    let firstTokenTimer: NodeJS.Timeout | null = null;
    let idleTimer: NodeJS.Timeout | null = null;
    let maxGenTimer: NodeJS.Timeout | null = null;
    let receivedFirstEvent = false;

    if (abortSignal) {
      abortSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    // Phase 1: Connection timeout
    connectionTimer = setTimeout(() => {
      controller.abort();
      this.logger.warn(
        `FastAPI connection timed out after ${connectionTimeoutMs}ms for req ${payload.requestId}`,
      );
    }, connectionTimeoutMs);

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

      // Clear connection timer once HTTP response received
      if (connectionTimer) {
        clearTimeout(connectionTimer);
        connectionTimer = null;
      }

      if (!response.ok || !response.body) {
        throw new Error(`FastAPI AI Service HTTP error ${response.status}`);
      }

      // Phase 2: First token and Max generation timeouts
      maxGenTimer = setTimeout(() => {
        controller.abort();
        this.logger.warn(
          `FastAPI max generation time exceeded (${maxGenerationTimeoutMs}ms) for req ${payload.requestId}`,
        );
      }, maxGenerationTimeoutMs);

      firstTokenTimer = setTimeout(() => {
        if (!receivedFirstEvent) {
          controller.abort();
          this.logger.warn(
            `FastAPI first token timed out after ${firstTokenTimeoutMs}ms for req ${payload.requestId}`,
          );
        }
      }, firstTokenTimeoutMs);

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

        // Parse complete SSE events separated by \r\n\r\n or \n\n
        while (true) {
          const crlfIdx = buffer.indexOf('\r\n\r\n');
          const lfIdx = buffer.indexOf('\n\n');
          let boundaryIdx = -1;
          let delimiterLen = 2;

          if (crlfIdx !== -1 && lfIdx !== -1) {
            if (crlfIdx <= lfIdx) {
              boundaryIdx = crlfIdx;
              delimiterLen = 4;
            } else {
              boundaryIdx = lfIdx;
              delimiterLen = 2;
            }
          } else if (crlfIdx !== -1) {
            boundaryIdx = crlfIdx;
            delimiterLen = 4;
          } else if (lfIdx !== -1) {
            boundaryIdx = lfIdx;
            delimiterLen = 2;
          }

          if (boundaryIdx === -1) {
            break;
          }

          const rawChunk = buffer.slice(0, boundaryIdx);
          buffer = buffer.slice(boundaryIdx + delimiterLen);

          const parsedEvent = this.parseSseChunk(rawChunk);
          if (parsedEvent) {
            if (!receivedFirstEvent) {
              receivedFirstEvent = true;
              if (firstTokenTimer) {
                clearTimeout(firstTokenTimer);
                firstTokenTimer = null;
              }
            }

            // Reset idle timeout on each valid chunk received
            if (idleTimer) clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
              controller.abort();
              this.logger.warn(
                `FastAPI stream idle timeout (${idleTimeoutMs}ms) for req ${payload.requestId}`,
              );
            }, idleTimeoutMs);

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
      if (connectionTimer) clearTimeout(connectionTimer);
      if (firstTokenTimer) clearTimeout(firstTokenTimer);
      if (idleTimer) clearTimeout(idleTimer);
      if (maxGenTimer) clearTimeout(maxGenTimer);
    }
  }

  async evaluateHomework(payload: {
    submission_id: string;
    student_id: string;
    language?: 'bn' | 'en';
    raw_text?: string;
    prompt?: string;
    image_urls?: string[];
    class_level?: number;
    subject_id?: string;
    chapter_id?: string;
    lesson_id?: string;
    subject_title?: string;
    chapter_title?: string;
    lesson_title?: string;
  }): Promise<any> {
    const baseUrl =
      this.configService.get<string>('aiService.baseUrl')?.replace(/\/+$/, '') ??
      'http://localhost:8000/api/v1';
    const path = '/api/v1/homework/evaluate';
    const url = new URL(path, baseUrl);

    const requestBody = JSON.stringify(payload);
    const signedHeaders = this.hmacSignerService.generateSignedHeaders(
      'POST',
      path,
      requestBody,
      payload.submission_id,
    );

    const timeoutMs = this.configService.get<number>('aiService.timeoutMs') ?? 15000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...signedHeaders,
        },
        body: requestBody,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`FastAPI Homework Evaluation error ${response.status}`);
      }

      return await response.json();
    } catch (err: any) {
      this.logger.warn(
        `FastAPI evaluateHomework error for submission ${payload.submission_id}: ${err?.message}`,
      );
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Fetches vector store and ingestion statistics from FastAPI.
   */
  async getIngestionStats(): Promise<any> {
    const baseUrl =
      this.configService.get<string>('aiService.baseUrl')?.replace(/\/+$/, '') ??
      'http://localhost:8000/api/v1';
    const path = '/api/v1/ingestion/stats';
    const url = new URL(path, baseUrl);

    const signedHeaders = this.hmacSignerService.generateSignedHeaders('GET', path, '', 'stats-req');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...signedHeaders,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`FastAPI Ingestion Stats error ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Ingests a structured textbook chunk into FastAPI vector store.
   */
  async ingestTextbookChunk(payload: Record<string, any>): Promise<any> {
    const baseUrl =
      this.configService.get<string>('aiService.baseUrl')?.replace(/\/+$/, '') ??
      'http://localhost:8000/api/v1';
    const path = '/api/v1/ingestion/text';
    const url = new URL(path, baseUrl);

    const requestBody = JSON.stringify(payload);
    const signedHeaders = this.hmacSignerService.generateSignedHeaders(
      'POST',
      path,
      requestBody,
      payload.book_id || 'ingest-req',
    );

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...signedHeaders,
      },
      body: requestBody,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`FastAPI Textbook Ingestion error ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Deletes a book index from FastAPI vector store.
   */
  async deleteBookIndex(bookId: string): Promise<any> {
    const baseUrl =
      this.configService.get<string>('aiService.baseUrl')?.replace(/\/+$/, '') ??
      'http://localhost:8000/api/v1';
    const path = `/api/v1/ingestion/books/${encodeURIComponent(bookId)}`;
    const url = new URL(path, baseUrl);

    const signedHeaders = this.hmacSignerService.generateSignedHeaders('DELETE', path, '', bookId);

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        ...signedHeaders,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`FastAPI Delete Book error ${response.status}`);
    }

    return await response.json();
  }

  public parseSseChunk(chunk: string): TutorStreamEvent | null {
    const lines = chunk.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    let eventName: TutorStreamEvent['event'] = 'delta';
    const dataLines: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      if (!line || line.startsWith(':')) {
        // Skip empty lines or SSE comments (e.g. : keep-alive / ping)
        continue;
      }

      if (line.startsWith('event:')) {
        const name = line.slice('event:'.length).trim();
        if (['metadata', 'delta', 'citation', 'done', 'error'].includes(name)) {
          eventName = name as TutorStreamEvent['event'];
        }
      } else if (line.startsWith('data:')) {
        let dataContent = line.slice('data:'.length);
        if (dataContent.startsWith(' ')) {
          dataContent = dataContent.slice(1);
        }
        dataLines.push(dataContent);
      }
    }

    if (dataLines.length === 0) return null;

    const dataStr = dataLines.join('\n');
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
