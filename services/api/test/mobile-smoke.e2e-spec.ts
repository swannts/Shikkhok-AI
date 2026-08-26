import 'reflect-metadata';

process.env.NODE_ENV = 'test';
process.env.PORT = '4001';
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

describe('Mobile E2E Smoke Journey against NestJS API', () => {
  let app: INestApplication;
  let accessToken: string;
  const uniqueNum = Math.floor(10000000 + Math.random() * 89999999);
  const testEmail = `smoke_${uniqueNum}@example.com`;
  const testPhone = `017${uniqueNum}`;
  let conversationId: string;

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

  it('1. Register new Student via /api/v1/auth/register', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'তানভীর আহমেদ',
        email: testEmail,
        phone: testPhone,
        password: 'SecurePassword123!',
        role: 'student',
      })
      .expect(201);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('requestId');
    expect(res.body.data).toHaveProperty('tokens');
    expect(res.body.data.user.email).toBe(testEmail);
    accessToken = res.body.data.tokens.accessToken;
    expect(accessToken).toBeDefined();
  });

  it('2. Login Student via /api/v1/auth/login', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: testEmail,
        password: 'SecurePassword123!',
      })
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('tokens');
    expect(res.body.data.tokens.accessToken).toBeDefined();
    accessToken = res.body.data.tokens.accessToken;
  });

  it('3. Fetch Current User via /api/v1/auth/me', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body.data.email).toBe(testEmail);
    expect(res.body.data.role).toBe('student');
  });

  it('4. Fetch Curriculum Subjects via /api/v1/curriculum/subjects', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/curriculum/subjects?classLevel=8&medium=bangla&curriculumYear=2026')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('5. List & Start Tutor Conversation via /api/v1/tutor/me/conversations', async () => {
    const startRes = await request(app.getHttpServer())
      .post('/api/v1/tutor/me/conversations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'বীজগণিত প্রশ্ন',
      })
      .expect(201);

    expect(startRes.body).toHaveProperty('data');
    expect(startRes.body.data).toHaveProperty('_id');
    conversationId = startRes.body.data._id;

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/tutor/me/conversations')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(listRes.body).toHaveProperty('data');
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('6. Get Tutor Conversation Messages with Paginated Envelope', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/tutor/me/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('meta');
  });

  it('7. Submit Offline Sync Batch via /api/v1/sync/me/batches', async () => {
    const deviceId = `test-device-${Date.now()}`;
    const opId = `op-smoke-${Date.now()}`;

    const res = await request(app.getHttpServer())
      .post('/api/v1/sync/me/batches')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        deviceId,
        operations: [
          {
            operationId: opId,
            operationType: 'lesson_progress.upsert',
            entityType: 'lesson_progress',
            payload: {
              lessonId: '65c23e80f123456789012345',
              progressPercent: 75,
              isCompleted: false,
            },
          },
        ],
      })
      .expect(201);

    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('summary');
    expect(res.body.data.summary.received).toBe(1);

    const checkpointRes = await request(app.getHttpServer())
      .get(`/api/v1/sync/me/checkpoints/${deviceId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(checkpointRes.body).toHaveProperty('data');
    expect(checkpointRes.body.data.deviceId).toBe(deviceId);
    expect(checkpointRes.body.data.lastOperationId).toBe(opId);
  });
});
