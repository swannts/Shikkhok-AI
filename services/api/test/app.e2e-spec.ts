import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/shikkhok_test_db';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-key-16chars';
    process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-16chars';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /api/v1/health/live (Liveness)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health/live')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe('ok');
      });
  });
});
