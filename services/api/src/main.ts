import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './core/socket/redis-io.adapter';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { GlobalExceptionFilter } from './core/errors/global-exception.filter';
import { AppLoggerService } from './core/logging/logging.service';
import { MetricsService } from './common/metrics/metrics.service';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new AppLoggerService(),
  });
  app.set('trust proxy', true);

  const configService = app.get(ConfigService);

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  const allowedOrigins = configService.get<string[]>('cors.origins', [
    'http://localhost:3000',
    'http://localhost:4000',
    'http://localhost:8081',
  ]);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS allowlist'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Prefix & URI API Versioning (/api/v1)
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  const metricsService = app.get(MetricsService);
  app.useGlobalInterceptors(
    new RequestIdInterceptor(),
    new MetricsInterceptor(metricsService),
    new TransformResponseInterceptor(),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Socket.IO Redis adapter for distributed live classrooms
  const redisIoAdapter = new RedisIoAdapter(configService, app.getHttpServer());
  app.useWebSocketAdapter(redisIoAdapter);

  // Swagger OpenAPI Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Shikkhok-AI Backend API')
    .setDescription('Production-grade NestJS, MongoDB, and Redis API for Bangladeshi NCTB Students')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('port', 4000);
  await app.listen(port);

  const logger = app.get(AppLoggerService);
  logger.log(`🚀 NestJS Shikkhok-AI API live on http://localhost:${port}/api/v1`, 'Bootstrap');
  logger.log(
    `📚 Swagger OpenAPI Documentation live on http://localhost:${port}/api/docs`,
    'Bootstrap',
  );
}

bootstrap();
