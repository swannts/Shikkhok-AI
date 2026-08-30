import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface SignedHeaders {
  'X-Service-Name': string;
  'X-Service-Timestamp': string;
  'X-Request-Id': string;
  'X-Service-Signature': string;
}

@Injectable()
export class HmacSignerService {
  private readonly serviceName = 'nestjs-backend';

  constructor(private readonly configService: ConfigService) {}

  /**
   * Computes SHA-256 hash of request body bytes.
   */
  computeBodySha256(body: string | Buffer): string {
    const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf-8');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Computes HMAC-SHA256 signature matching the canonical format expected by the FastAPI service.
   * Canonical string: timestamp\nMETHOD\n/path\nbody_sha256
   */
  computeSignature(
    secret: string,
    timestamp: string,
    method: string,
    path: string,
    bodySha256: string,
  ): string {
    const canonicalString = `${timestamp}\n${method.toUpperCase()}\n${path}\n${bodySha256}`;
    return crypto.createHmac('sha256', secret).update(canonicalString, 'utf-8').digest('hex');
  }

  /**
   * Generates all required internal service authentication headers.
   */
  generateSignedHeaders(
    method: string,
    path: string,
    body: string | Buffer,
    requestId: string,
    explicitTimestamp?: string,
  ): SignedHeaders {
    const secret =
      this.configService.get<string>('aiService.secret') ||
      'dev-internal-ai-service-secret-at-least-32chars';
    const timestamp = explicitTimestamp ?? Math.floor(Date.now() / 1000).toString();
    const bodySha256 = this.computeBodySha256(body);
    const signature = this.computeSignature(secret, timestamp, method, path, bodySha256);

    return {
      'X-Service-Name': this.serviceName,
      'X-Service-Timestamp': timestamp,
      'X-Request-Id': requestId,
      'X-Service-Signature': signature,
    };
  }
}
