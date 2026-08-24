import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { GlobalExceptionFilter } from './core/errors/global-exception.filter';
import { AppLoggerService } from './core/logging/logging.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new AppLoggerService(),
  });

  const configService = app.get(ConfigService);

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  const allowedOrigins = configService.get<string[]>(
    'cors.origins',
    ['http://localhost:3000', 'http://localhost:4000', 'http://localhost:8081'],
  );

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

  // Global Prefix & Request Interceptors
  app.setGlobalPrefix('api/v1');
  app.useGlobalInterceptors(new RequestIdInterceptor(), new TransformResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

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
  logger.log(`📚 Swagger OpenAPI Documentation live on http://localhost:${port}/api/docs`, 'Bootstrap');
}

bootstrap();
