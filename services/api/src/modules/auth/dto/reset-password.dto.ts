import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Password reset token received via OTP/email' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewSecureP@ss456', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  @MaxLength(128, { message: 'New password must be at most 128 characters' })
  newPassword: string;
}
