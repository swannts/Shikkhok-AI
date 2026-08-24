import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  validateSync,
  MinLength,
  Matches,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Staging = 'staging',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  PORT: number = 4000;

  @IsString()
  @MinLength(1, { message: 'MONGODB_URI must be provided' })
  MONGODB_URI: string;

  @IsString()
  @MinLength(1, { message: 'REDIS_URL must be provided' })
  REDIS_URL: string;

  @IsString()
  @MinLength(32, { message: 'JWT_ACCESS_SECRET must be at least 32 characters' })
  JWT_ACCESS_SECRET: string;

  @IsString()
  @MinLength(32, { message: 'JWT_REFRESH_SECRET must be at least 32 characters' })
  JWT_REFRESH_SECRET: string;

  @IsString()
  JWT_ACCESS_TTL: string = '15m';

  @IsString()
  JWT_REFRESH_TTL: string = '7d';

  @IsString()
  CORS_ORIGINS: string = 'http://localhost:3000,http://localhost:4000,http://localhost:8081';

  @IsOptional()
  @IsUrl({ require_tld: false }, { message: 'AI_GATEWAY_URL must be a valid URL' })
  AI_GATEWAY_URL?: string;

  @IsOptional()
  @Matches(/^\d+$/, { message: 'AI_GATEWAY_TIMEOUT_MS must be a positive integer' })
  AI_GATEWAY_TIMEOUT_MS?: string;
}

export function validateConfig(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`❌ Environment Validation Error:\n${errors.toString()}`);
  }
  return validatedConfig;
}
