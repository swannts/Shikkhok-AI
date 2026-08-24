import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that enforces JWT bearer token authentication.
 * Apply with @UseGuards(JwtAuthGuard) on protected routes.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<T>(err: Error | null, user: T): T {
    if (err || !user) {
      throw new UnauthorizedException('Authentication required. Please provide a valid access token.');
    }
    return user;
  }
}
