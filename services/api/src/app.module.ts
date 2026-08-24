import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './core/config/configuration';
import { validateConfig } from './core/config/env.validation';
import { DatabaseModule } from './core/database/database.module';
import { RedisModule } from './core/redis/redis.module';
import { QueueModule } from './core/queue/queue.module';
import { HealthModule } from './core/health/health.module';
import { AppLoggerService } from './core/logging/logging.service';
import { HTTPLoggerMiddleware } from './core/logging/logger.middleware';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateConfig,
    }),
    DatabaseModule,
    RedisModule,
    QueueModule,
    HealthModule,
    UsersModule,
    AuthModule,
  ],
  providers: [AppLoggerService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HTTPLoggerMiddleware).forRoutes('*');
  }
}
