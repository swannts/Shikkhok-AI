import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string; // userId
  role: string; // UserRole value
}

export interface AuthenticatedUser {
  userId: string;
  role: string;
}

/**
 * Passport strategy for validating JWT access tokens.
 * Extracts bearer token from Authorization header,
 * verifies signature with JWT_ACCESS_SECRET,
 * and attaches { userId, role } to request.user.
 */
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret'),
    });
  }

  /**
   * Called after JWT signature is verified.
   * Return value is attached to request.user.
   */
  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      userId: payload.sub,
      role: payload.role,
    };
  }
}
