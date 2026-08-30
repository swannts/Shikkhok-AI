import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiGatewayService } from '../services/ai-gateway.service';
import { HmacSignerService } from '../services/hmac-signer.service';

describe('AiGatewayService', () => {
  let service: AiGatewayService;
  let configService: ConfigService;
  let hmacSignerService: HmacSignerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiGatewayService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'aiService.enabled') return true;
              if (key === 'aiService.baseUrl') return 'http://localhost:8000/api/v1';
              if (key === 'aiService.timeoutMs') return 5000;
              if (key === 'aiService.secret') return 'test-secret';
              return null;
            }),
          },
        },
        {
          provide: HmacSignerService,
          useValue: {
            generateSignedHeaders: jest.fn(() => ({
              'X-Service-Name': 'nestjs-backend',
              'X-Service-Timestamp': '1725000000',
              'X-Request-Id': 'req-test-1',
              'X-Service-Signature': 'mock-sig',
            })),
          },
        },
      ],
    }).compile();

    service = module.get<AiGatewayService>(AiGatewayService);
    configService = module.get<ConfigService>(ConfigService);
    hmacSignerService = module.get<HmacSignerService>(HmacSignerService);
  });

  it('should report service enabled based on config', () => {
    expect(service.isServiceEnabled()).toBe(true);
    (configService.get as jest.Mock).mockReturnValue(false);
    expect(service.isServiceEnabled()).toBe(false);
  });

  it('should stream and parse SSE chunks from FastAPI service', async () => {
    const sseResponseText = [
      'event: metadata',
      'data: {"provider":"gemini","model":"gemini-1.5-pro","fallbackUsed":false}',
      '',
      'event: delta',
      'data: {"text":"সুপ্রভাত! "}',
      '',
      'event: citation',
      'data: {"citationId":"source_1","sourceId":"c1","classLevel":8}',
      '',
      'event: done',
      'data: {"finishReason":"stop"}',
      '',
    ].join('\n');

    // Mock global fetch
    const mockResponse = {
      ok: true,
      status: 200,
      body: {
        getReader: () => {
          let readCount = 0;
          return {
            read: async () => {
              if (readCount === 0) {
                readCount++;
                return {
                  done: false,
                  value: new TextEncoder().encode(sseResponseText),
                };
              }
              return { done: true, value: undefined };
            },
          };
        },
      },
    };

    global.fetch = jest.fn().mockResolvedValue(mockResponse) as any;

    const events: any[] = [];
    for await (const evt of service.streamTutorResponse({
      requestId: 'req-test-1',
      userId: 'u1',
      conversationId: 'c1',
      message: 'হ্যালো',
      language: 'bn',
      classLevel: 8,
    })) {
      events.push(evt);
    }

    expect(events).toHaveLength(4);
    expect(events[0].event).toBe('metadata');
    expect(events[0].data.provider).toBe('gemini');
    expect(events[1].event).toBe('delta');
    expect(events[1].data.text).toBe('সুপ্রভাত! ');
    expect(events[2].event).toBe('citation');
    expect(events[2].data.citationId).toBe('source_1');
    expect(events[3].event).toBe('done');
    expect(events[3].data.finishReason).toBe('stop');

    expect(hmacSignerService.generateSignedHeaders).toHaveBeenCalled();
  });
});
