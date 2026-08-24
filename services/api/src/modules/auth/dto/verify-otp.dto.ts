import { IsString, IsEnum, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OtpPurpose } from './request-otp.dto';

export class VerifyOtpDto {
  @ApiProperty({ example: '01712345678' })
  @IsString()
  @Matches(/^(\+?880|0)1[3-9]\d{8}$/, {
    message: 'Phone must be a valid Bangladeshi mobile number',
  })
  phone: string;

  @ApiProperty({ example: '482901', description: '6-digit OTP code' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp: string;

  @ApiProperty({ enum: OtpPurpose, example: OtpPurpose.REGISTRATION })
  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;
}
