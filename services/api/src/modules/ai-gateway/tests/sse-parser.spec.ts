import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiGatewayService } from '../services/ai-gateway.service';
import { HmacSignerService } from '../services/hmac-signer.service';

describe('AiGatewayService SSE Parser Hardening', () => {
  let service: AiGatewayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiGatewayService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => null),
          },
        },
        {
          provide: HmacSignerService,
          useValue: {
            generateSignedHeaders: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AiGatewayService>(AiGatewayService);
  });

  it('should parse standard SSE event with LF line endings', () => {
    const chunk = 'event: delta\ndata: {"text":"হ্যালো"}\n';
    const parsed = service.parseSseChunk(chunk);
    expect(parsed).not.toBeNull();
    expect(parsed?.event).toBe('delta');
    expect((parsed?.data as { text?: string })?.text).toBe('হ্যালো');
  });

  it('should parse SSE event with CRLF line endings', () => {
    const chunk = 'event: delta\r\ndata: {"text":"সুপ্রভাত"}\r\n';
    const parsed = service.parseSseChunk(chunk);
    expect(parsed).not.toBeNull();
    expect(parsed?.event).toBe('delta');
    expect((parsed?.data as { text?: string })?.text).toBe('সুপ্রভাত');
  });

  it('should join multiline JSON data fields and validate the payload', () => {
    const chunk = 'event: delta\ndata: {"text":\ndata: "line 1\\nline 2"}\n';
    const parsed = service.parseSseChunk(chunk);
    expect(parsed).not.toBeNull();
    expect(parsed?.event).toBe('delta');
    expect((parsed?.data as { text?: string })?.text).toBe('line 1\nline 2');
  });

  it('should ignore SSE comments starting with colon', () => {
    const chunk = ': ping\n: keepalive\nevent: done\ndata: {"finishReason":"stop"}\n';
    const parsed = service.parseSseChunk(chunk);
    expect(parsed).not.toBeNull();
    expect(parsed?.event).toBe('done');
    expect((parsed as any)?.data.finishReason).toBe('stop');
  });

  it('should return null for empty or comment-only chunks', () => {
    expect(service.parseSseChunk('')).toBeNull();
    expect(service.parseSseChunk('   \n  \r\n')).toBeNull();
    expect(service.parseSseChunk(': just a comment\n: another comment')).toBeNull();
  });

  it('rejects unknown event names and malformed JSON instead of treating them as deltas', () => {
    expect(service.parseSseChunk('event: progress\ndata: {"text":"ignored"}')).toBeNull();
    expect(service.parseSseChunk('event: metadata\ndata: not-json')).toBeNull();
  });

  it('rejects malformed event payloads', () => {
    expect(service.parseSseChunk('event: metadata\ndata: {"grounded":true}')).toBeNull();
    expect(service.parseSseChunk('event: citation\ndata: {"sourceBook":"book"}')).toBeNull();
    expect(service.parseSseChunk('event: delta\ndata: {"text":4}')).toBeNull();
  });
});
