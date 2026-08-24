import { Injectable } from '@nestjs/common';

export interface TutorGatewayReply {
  content: string;
  citations: Array<Record<string, any>>;
  provider?: string;
}

export interface TutorGatewayRequest {
  conversationId?: string;
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
  async generateReply(request: TutorGatewayRequest): Promise<TutorGatewayReply | null> {
    const gatewayUrl = process.env.AI_GATEWAY_URL?.trim();
    if (!gatewayUrl) {
      return null;
    }

    const endpoint = new URL('/ai/v1/tutor/chat/stream', gatewayUrl).toString();
    const controller = new AbortController();
    const timeoutMs = Number(process.env.AI_GATEWAY_TIMEOUT_MS || 12000);
    const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 12000);

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
        return null;
      }

      return await this.parseSseResponse(response);
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async parseSseResponse(response: Response): Promise<TutorGatewayReply> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let content = '';
    let provider: string | undefined;
    const citationsByKey = new Map<string, Record<string, any>>();

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
            const key = [
              source?.sourceBook ?? '',
              source?.class ?? '',
              source?.subject ?? '',
              source?.chapter ?? '',
              source?.pageNumber ?? '',
            ].join('|');
            if (key && !citationsByKey.has(key)) {
              citationsByKey.set(key, source);
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
    } finally {
      decoder.decode();
    }

    return {
      content: content.trim(),
      citations: Array.from(citationsByKey.values()),
      provider,
    };
  }
}
