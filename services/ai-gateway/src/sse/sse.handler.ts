import { Response } from 'express';
import { StringDecoder } from 'string_decoder';

export class SseStreamHandler {
  private decoder = new StringDecoder('utf8');
  private isClientConnected = true;

  constructor(private res: Response) {
    // Enable HTTP headers for Server-Sent Events
    this.res.setHeader('Content-Type', 'text/event-stream');
    this.res.setHeader('Cache-Control', 'no-cache, no-transform');
    this.res.setHeader('Connection', 'keep-alive');
    this.res.setHeader('X-Accel-Buffering', 'no');

    // Handle client disconnect / cancellation
    this.res.on('close', () => {
      this.isClientConnected = false;
    });
  }

  public isConnected(): boolean {
    return this.isClientConnected;
  }

  /**
   * Format & emit standard SSE event structure:
   * event: <eventName>
   * data: <jsonData>
   */
  public emitEvent(eventName: string, data: any) {
    if (!this.isClientConnected) return;

    try {
      this.res.write(`event: ${eventName}\n`);
      this.res.write(`data: ${JSON.stringify(data)}\n\n`);
      
      // Flush socket if flush function is supported by compression middleware
      if (typeof (this.res as any).flush === 'function') {
        (this.res as any).flush();
      }
    } catch (err) {
      console.warn('[SSE] Failed to write chunk to response stream:', err);
      this.isClientConnected = false;
    }
  }

  /**
   * Safely process raw buffer chunks handling partial UTF-8 multi-byte sequences
   */
  public emitDelta(chunk: string | Buffer) {
    if (!this.isClientConnected) return;

    let text = '';
    if (Buffer.isBuffer(chunk)) {
      text = this.decoder.write(chunk);
    } else {
      text = chunk;
    }

    if (text) {
      this.emitEvent('delta', { text });
    }
  }

  /**
   * Finalize UTF-8 decoder buffer to prevent dropped characters at stream end
   */
  public flushDecoderDelta() {
    const trailingText = this.decoder.end();
    if (trailingText && this.isClientConnected) {
      this.emitEvent('delta', { text: trailingText });
    }
  }

  /**
   * Emit metadata event (token counts, conversationId, cost)
   */
  public emitMetadata(metadata: Record<string, any>) {
    this.emitEvent('metadata', metadata);
  }

  /**
   * Emit stream error event when provider times out or fails
   */
  public emitError(error: { code: string; message: string; banglaMessage?: string }) {
    this.emitEvent('error', error);
  }

  /**
   * Close SSE stream cleanly
   */
  public finish() {
    this.flushDecoderDelta();
    this.emitEvent('done', {});
    if (this.isClientConnected) {
      this.res.end();
    }
  }
}
