import 'reflect-metadata';

// Set test environment variables before AppModule is imported
process.env.NODE_ENV = 'test';
process.env.PORT = '4000';
process.env.MONGODB_URI =
  'mongodb://shikkhok_admin:shikkhok_secure_password@localhost:27017/shikkhok_test_db?authSource=admin';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-key-16chars';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-16chars';
process.env.JWT_ACCESS_TTL = '15m';
process.env.JWT_REFRESH_TTL = '7d';
process.env.CORS_ORIGINS = 'http://localhost:3000,http://localhost:4000';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformResponseInterceptor } from '../src/common/interceptors/transform-response.interceptor';
import { RequestIdInterceptor } from '../src/common/interceptors/request-id.interceptor';
import { GlobalExceptionFilter } from '../src/core/errors/global-exception.filter';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalInterceptors(new RequestIdInterceptor(), new TransformResponseInterceptor());
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 10000);

  it('GET /api/v1/health/live (Liveness)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health/live')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe('ok');
        expect(res.body.requestId).toBeDefined();
      });
  });

  it('GET /api/v1/health/ready (Readiness)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health/ready')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.services).toBeDefined();
        expect(res.body.requestId).toBeDefined();
      });
  });
});
