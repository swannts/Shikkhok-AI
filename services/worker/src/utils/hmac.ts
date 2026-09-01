import crypto from 'crypto';

export function computeBodySha256(body: string | Buffer): string {
  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf-8');
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function computeHmacSignature(
  secret: string,
  timestamp: string,
  method: string,
  path: string,
  body: string | Buffer,
): string {
  const bodyHash = computeBodySha256(body);
  const canonical = `${timestamp}\n${method.toUpperCase()}\n${path}\n${bodyHash}`;
  return crypto.createHmac('sha256', secret).update(canonical, 'utf-8').digest('hex');
}

export function generateSignedHeaders(
  secret: string,
  serviceName: string,
  method: string,
  path: string,
  body: string | Buffer,
  requestId: string,
  explicitTimestamp?: string,
): {
  'X-Service-Name': string;
  'X-Service-Timestamp': string;
  'X-Service-Signature': string;
  'X-Request-Id': string;
} {
  const timestamp = explicitTimestamp ?? Math.floor(Date.now() / 1000).toString();
  const signature = computeHmacSignature(secret, timestamp, method, path, body);
  return {
    'X-Service-Name': serviceName,
    'X-Service-Timestamp': timestamp,
    'X-Service-Signature': signature,
    'X-Request-Id': requestId,
  };
}
