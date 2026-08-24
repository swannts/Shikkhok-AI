import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../users/enums/user-role.enum';

/**
 * Registration DTO.
 * At least one of email or phone must be provided.
 */
export class RegisterDto {
  @ApiProperty({ example: 'রাহুল আহমেদ', description: 'Full name of the user' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'rahul@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiPropertyOptional({
    example: '01712345678',
    description: 'Bangladeshi phone number (01XXXXXXXXX format)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(\+?880|0)1[3-9]\d{8}$/, {
    message: 'Phone must be a valid Bangladeshi mobile number',
  })
  phone?: string;

  @ApiProperty({ example: 'SecureP@ss123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password must be at most 128 characters' })
  password: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.STUDENT,
    description: 'User role (defaults to student)',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
