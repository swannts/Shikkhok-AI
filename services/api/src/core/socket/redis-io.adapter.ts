import { IoAdapter } from '@nestjs/platform-socket.io';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { Server } from 'socket.io';
import { Server as IOServerOptions } from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private pubClient?: Redis;
  private subClient?: Redis;

  constructor(
    private readonly configService: ConfigService,
    httpServer: any,
  ) {
    super(httpServer);
  }

  async create(port: number, options?: IOServerOptions): Promise<Server> {
    const server = (await super.create(port, options)) as Server;
    const redisUrl = this.configService.get<string>('redis.url', 'redis://localhost:6379');
    const environment = this.configService.get<string>('environment') || 'development';

    this.pubClient = new Redis(redisUrl, { maxRetriesPerRequest: null });
    this.subClient = this.pubClient.duplicate();

    this.pubClient.on('error', (err: Error) =>
      this.logger.error(`Socket.IO Redis pub client error: ${err.message}`),
    );
    this.subClient.on('error', (err: Error) =>
      this.logger.error(`Socket.IO Redis sub client error: ${err.message}`),
    );

    try {
      await Promise.all([
        this.pubClient.ping(),
        this.subClient.ping(),
      ]);
    } catch (err) {
      if (environment === 'production' || environment === 'staging') {
        this.logger.error(
          `FATAL: Socket.IO Redis adapter could not connect to ${redisUrl}. Live classroom cannot operate across replicas.`,
        );
        throw err;
      }
      this.logger.warn(
        `Redis unavailable at ${redisUrl}. Live classroom will run in single-instance mode (no cross-pod broadcast).`,
      );
      return server;
    }

    server.adapter(createAdapter(this.pubClient, this.subClient));
    this.logger.log(`Socket.IO Redis adapter connected to ${redisUrl}`);

    return server;
  }

  async close(server: Server): Promise<void> {
    const cleanup = async () => {
      if (this.pubClient && this.pubClient.status !== 'end') {
        await this.pubClient.quit();
      }
      if (this.subClient && this.subClient.status !== 'end') {
        await this.subClient.quit();
      }
    };
    await cleanup();
    await super.close(server);
  }
}
