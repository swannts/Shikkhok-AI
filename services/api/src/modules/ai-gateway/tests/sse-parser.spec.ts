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
    expect(parsed?.data.text).toBe('হ্যালো');
  });

  it('should parse SSE event with CRLF line endings', () => {
    const chunk = 'event: delta\r\ndata: {"text":"সুপ্রভাত"}\r\n';
    const parsed = service.parseSseChunk(chunk);
    expect(parsed).not.toBeNull();
    expect(parsed?.event).toBe('delta');
    expect(parsed?.data.text).toBe('সুপ্রভাত');
  });

  it('should support multiline data fields joined with newlines', () => {
    const chunk = 'event: delta\ndata: line 1\ndata: line 2\n';
    const parsed = service.parseSseChunk(chunk);
    expect(parsed).not.toBeNull();
    expect(parsed?.event).toBe('delta');
    expect(parsed?.data.text).toBe('line 1\nline 2');
  });

  it('should ignore SSE comments starting with colon', () => {
    const chunk = ': ping\n: keepalive\nevent: done\ndata: {"finishReason":"stop"}\n';
    const parsed = service.parseSseChunk(chunk);
    expect(parsed).not.toBeNull();
    expect(parsed?.event).toBe('done');
    expect(parsed?.data.finishReason).toBe('stop');
  });

  it('should return null for empty or comment-only chunks', () => {
    expect(service.parseSseChunk('')).toBeNull();
    expect(service.parseSseChunk('   \n  \r\n')).toBeNull();
    expect(service.parseSseChunk(': just a comment\n: another comment')).toBeNull();
  });
});
