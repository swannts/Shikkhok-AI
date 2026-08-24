import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'rahul@example.com',
    description: 'Email address or Bangladeshi phone number',
  })
  @IsString()
  identifier: string;

  @ApiProperty({ example: 'SecureP@ss123' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ example: 'device-uuid-abc-123', description: 'Client device UUID' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ example: 'Samsung Galaxy S24', description: 'Human-readable device name' })
  @IsOptional()
  @IsString()
  deviceName?: string;
}
