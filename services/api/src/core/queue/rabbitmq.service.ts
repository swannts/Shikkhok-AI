import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { ChannelModel, ConfirmChannel, ConsumeMessage, GetMessage, Options } from 'amqplib';
import { RedisService } from '../redis/redis.service';

export interface QueueJob<T = unknown> {
  id: string;
  name: string;
  data: T;
  attemptsMade?: number;
}

const retryDelays = (queue: string): number[] => queue === 'curriculum' ? [5_000, 10_000] : [2_000, 4_000];
const MAX_ATTEMPTS = 3;

@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqService.name);
  private connection?: ChannelModel;
  private channel?: ConfirmChannel;
  private connecting?: Promise<void>;
  private reconnecting?: Promise<void>;
  private shuttingDown = false;
  private readonly consumers = new Map<string, { handler: (job: QueueJob) => Promise<unknown>; prefetch: number }>();

  constructor(private readonly redis: RedisService) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    this.shuttingDown = true;
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  private async connect(): Promise<void> {
    if (this.channel) return;
    if (this.connecting) return this.connecting;
    this.connecting = (async () => {
      const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672/';
      const connection = await amqp.connect(url);
      this.connection = connection;
      connection.on('close', () => {
        if (this.connection !== connection) return;
        this.channel = undefined;
        this.connection = undefined;
        if (!this.shuttingDown) this.scheduleReconnect();
      });
      connection.on('error', (error) => this.logger.error(`RabbitMQ connection error: ${error.message}`));
      this.channel = await connection.createConfirmChannel();
    })();
    try { await this.connecting; } finally { this.connecting = undefined; }
  }

  private async ensureQueue(queue: string): Promise<ConfirmChannel> {
    await this.connect();
    const ch = this.channel!;
    await ch.assertQueue(queue, { durable: true });
    await ch.assertQueue(`${queue}-dlq`, { durable: true });
    for (const [index, ttl] of retryDelays(queue).entries()) {
      await ch.assertQueue(`${queue}.retry.${index + 1}`, {
        durable: true,
        arguments: { 'x-message-ttl': ttl, 'x-dead-letter-exchange': '', 'x-dead-letter-routing-key': queue },
      });
    }
    return ch;
  }

  async publish<T>(queue: string, name: string, data: T, id = `${queue}-${Date.now()}-${Math.random().toString(36).slice(2)}`): Promise<void> {
    const ch = await this.ensureQueue(queue);
    const dedupKey = this.dedupKey(queue, id);
    const accepted = await this.redis.getClient().set(dedupKey, 'queued', 'EX', 86400, 'NX');
    if (accepted !== 'OK') return;
    const job: QueueJob<T> = { id, name, data };
    try {
      await new Promise<void>((resolve, reject) => ch.sendToQueue(queue, Buffer.from(JSON.stringify(job)), {
        persistent: true, contentType: 'application/json', messageId: id, timestamp: Date.now(),
      }, (error) => error ? reject(error) : resolve()));
    } catch (error) {
      await this.redis.del(dedupKey);
      throw error;
    }
  }

  async consume(queue: string, handler: (job: QueueJob) => Promise<unknown>, prefetch = 1): Promise<void> {
    this.consumers.set(queue, { handler, prefetch });
    await this.registerConsumer(queue, handler, prefetch);
  }

  private async registerConsumer(queue: string, handler: (job: QueueJob) => Promise<unknown>, prefetch: number): Promise<void> {
    const ch = await this.ensureQueue(queue);
    await ch.prefetch(prefetch);
    await ch.consume(queue, (message) => {
      if (message) void this.handleMessage(ch, queue, message, handler);
    }, { noAck: false });
  }

  private scheduleReconnect(): void {
    if (this.reconnecting || this.shuttingDown) return;
    this.reconnecting = (async () => {
      while (!this.shuttingDown) {
        await new Promise((resolve) => setTimeout(resolve, 2_000));
        try {
          await this.connect();
          for (const [queue, consumer] of this.consumers) {
            await this.registerConsumer(queue, consumer.handler, consumer.prefetch);
          }
          this.logger.log('RabbitMQ consumers reconnected');
          return;
        } catch (error) {
          this.logger.error(`RabbitMQ reconnect failed: ${String(error)}`);
          this.channel = undefined;
          this.connection = undefined;
        }
      }
    })().finally(() => { this.reconnecting = undefined; });
  }

  private async handleMessage(ch: ConfirmChannel, queue: string, message: ConsumeMessage, handler: (job: QueueJob) => Promise<unknown>): Promise<void> {
    let job: QueueJob;
    try {
      job = JSON.parse(message.content.toString()) as QueueJob;
      if (!job.id || !job.name) throw new Error('Malformed queue message: id and name are required');
      await handler(job);
      ch.ack(message);
      void this.redis.del(this.dedupKey(queue, job.id)).catch(() => undefined);
      return;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const attempts = Number(message.properties.headers?.['x-attempts'] ?? 0) + 1;
      const target = attempts >= MAX_ATTEMPTS ? `${queue}-dlq` : `${queue}.retry.${attempts}`;
      let original: QueueJob;
      try { original = JSON.parse(message.content.toString()) as QueueJob; }
      catch { original = { id: message.properties.messageId || 'unknown', name: 'INVALID', data: message.content.toString() }; }
      const payload = attempts >= MAX_ATTEMPTS
        ? { ...original, attemptsMade: attempts, error: reason, failedAt: new Date().toISOString() }
        : message.content;
      const body = Buffer.isBuffer(payload) ? payload : Buffer.from(JSON.stringify(payload));
      const options: Options.Publish = {
        persistent: true,
        contentType: 'application/json',
        messageId: message.properties.messageId,
        headers: { ...message.properties.headers, 'x-attempts': attempts },
      };
      try {
        await this.publishRaw(ch, target, body, options);
        ch.ack(message);
        this.logger.error(`${queue} job ${message.properties.messageId || 'unknown'} failed (${attempts}/${MAX_ATTEMPTS}): ${reason}`);
      } catch (publishError) {
        this.logger.error(`Could not route failed ${queue} job; requeueing: ${String(publishError)}`);
        ch.nack(message, false, true);
      }
    }
  }

  private async publishRaw(ch: ConfirmChannel, queue: string, body: Buffer, options: Options.Publish): Promise<void> {
    await ch.assertQueue(queue, { durable: true });
    await new Promise<void>((resolve, reject) => ch.sendToQueue(queue, body, options, (error) => error ? reject(error) : resolve()));
  }

  private dedupKey(queue: string, id: string): string { return `idemp:rabbitmq:${queue}:${id}`; }

  async check(): Promise<boolean> {
    try { await this.connect(); await this.channel!.checkQueue('notifications'); return true; } catch { return false; }
  }

  async stats(queue: string): Promise<{ waiting: number; consumers: number; failed: number }> {
    const ch = await this.ensureQueue(queue);
    const main = await ch.checkQueue(queue);
    const dead = await ch.checkQueue(`${queue}-dlq`);
    return { waiting: main.messageCount, consumers: main.consumerCount, failed: dead.messageCount };
  }

  async listFailed(queue: string, limit: number): Promise<Array<Record<string, unknown>>> {
    const ch = await this.ensureQueue(`${queue}`);
    const dlq = `${queue}-dlq`;
    const messages: GetMessage[] = [];
    const result: Array<Record<string, unknown>> = [];
    for (let i = 0; i < limit; i++) {
      const message = await ch.get(dlq, { noAck: false });
      if (!message) break;
      messages.push(message);
      try {
        const failed = JSON.parse(message.content.toString()) as Record<string, unknown>;
        result.push({
          id: failed.id,
          name: failed.name,
          failedReason: failed.error,
          attemptsMade: failed.attemptsMade,
          timestamp: typeof failed.failedAt === 'string' ? Date.parse(failed.failedAt) : 0,
          data: failed.data,
        });
      }
      catch { result.push({ error: 'Invalid dead-letter message' }); }
    }
    for (const message of messages) ch.nack(message, false, true);
    return result;
  }

  async retryFailed(queue: string, limit: number): Promise<number> {
    const ch = await this.ensureQueue(queue);
    let retried = 0;
    const dlq = `${queue}-dlq`;
    for (let i = 0; i < limit; i++) {
      const message = await ch.get(dlq, { noAck: false });
      if (!message) break;
      try {
        const failed = JSON.parse(message.content.toString()) as QueueJob;
        const id = failed.id || `${queue}-retry-${Date.now()}-${i}`;
        await this.redis.del(this.dedupKey(queue, id));
        await this.publish(queue, failed.name || 'RETRIED', failed.data, id);
        ch.ack(message);
        retried++;
      } catch {
        ch.nack(message, false, true);
        break;
      }
    }
    return retried;
  }
}
