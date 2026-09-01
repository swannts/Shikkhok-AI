import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class InternalAuthGuard implements CanActivate {
  private readonly logger = new Logger(InternalAuthGuard.name);

  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const serviceName = request.headers['x-service-name'] as string;
    const timestamp = request.headers['x-service-timestamp'] as string;
    const signature = request.headers['x-service-signature'] as string;
    const requestId = request.headers['x-request-id'] as string;

    if (!serviceName || !timestamp || !signature) {
      this.logger.warn(`Missing internal auth headers from ${request.ip}`);
      throw new UnauthorizedException('Missing service authentication headers');
    }

    const allowedServices = this.configService.get<string[]>('aiService.allowedServices', [
      'nestjs-backend',
      'shikkhok-api',
      'shikkhok-worker',
    ]);
    if (!allowedServices.includes(serviceName)) {
      this.logger.warn(`Unauthorized service name: ${serviceName}`);
      throw new UnauthorizedException(`Service '${serviceName}' is not authorized`);
    }

    const now = Math.floor(Date.now() / 1000);
    const reqTimestamp = parseInt(timestamp, 10);
    if (Number.isNaN(reqTimestamp)) {
      throw new UnauthorizedException('Invalid X-Service-Timestamp: must be unix seconds');
    }

    const clockSkew = Math.abs(now - reqTimestamp);
    const allowedSkew = this.configService.get<number>('aiService.allowedClockSkewSeconds', 300);
    if (clockSkew > allowedSkew) {
      this.logger.warn(`Timestamp skew ${clockSkew}s exceeds allowed ${allowedSkew}s for ${serviceName}`);
      throw new UnauthorizedException('Request timestamp too far from server time');
    }

    const secret =
      this.configService.get<string>('aiService.secret') ||
      this.configService.get<string>('jwt.accessSecret') ||
      '';

    if (!secret) {
      this.logger.error('AI_SERVICE_SECRET is not configured');
      throw new UnauthorizedException('Internal authentication not configured');
    }

    const body = request.body as string | Buffer | undefined;
    let bodyForVerification: string | Buffer;

    if (typeof body === 'string') {
      bodyForVerification = body;
    } else if (Buffer.isBuffer(body)) {
      bodyForVerification = body;
    } else if (body !== undefined && body !== null) {
      bodyForVerification = JSON.stringify(body);
    } else {
      bodyForVerification = '';
    }

    const bodyHash = crypto.createHash('sha256').update(bodyForVerification).digest('hex');
    const method = (request.method || 'POST').toUpperCase();
    const path = request.route?.path
      ? `/api/v1/${request.route.path}`
      : request.url?.split('?')[0] || '';

    const canonical = `${timestamp}\n${method}\n${path}\n${bodyHash}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(canonical, 'utf-8')
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      this.logger.warn(`Invalid HMAC signature from service '${serviceName}'`);
      throw new UnauthorizedException('Invalid service signature');
    }

    request.internalServiceName = serviceName;
    request.internalRequestId = requestId;
    return true;
  }
}
