import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { HmacSignerService } from '../services/hmac-signer.service';

describe('HmacSignerService', () => {
  let service: HmacSignerService;
  const mockSecret = 'test-internal-secret-for-hmac-32chars';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HmacSignerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'aiService.secret') return mockSecret;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<HmacSignerService>(HmacSignerService);
  });

  it('should generate valid canonical SHA-256 body hash', () => {
    const body = JSON.stringify({ message: 'test' });
    const hash = service.computeBodySha256(body);
    const expected = crypto.createHash('sha256').update(body, 'utf-8').digest('hex');
    expect(hash).toBe(expected);
  });

  it('should generate valid canonical HMAC-SHA256 signature', () => {
    const timestamp = '1725000000';
    const method = 'POST';
    const path = '/api/v1/tutor/stream';
    const bodySha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    const canonical = `${timestamp}\n${method}\n${path}\n${bodySha256}`;
    const expectedSig = crypto
      .createHmac('sha256', mockSecret)
      .update(canonical, 'utf-8')
      .digest('hex');

    const sig = service.computeSignature(mockSecret, timestamp, method, path, bodySha256);
    expect(sig).toBe(expectedSig);
  });

  it('should produce complete signed headers with request ID and service name', () => {
    const headers = service.generateSignedHeaders(
      'POST',
      '/api/v1/tutor/stream',
      '{"message":"hello"}',
      'req-test-999',
      '1725000000',
    );

    expect(headers['X-Service-Name']).toBe('nestjs-backend');
    expect(headers['X-Service-Timestamp']).toBe('1725000000');
    expect(headers['X-Request-Id']).toBe('req-test-999');
    expect(headers['X-Service-Signature']).toBeDefined();
    expect(headers['X-Service-Signature'].length).toBe(64);
  });
});
