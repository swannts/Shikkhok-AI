import { IsString, IsEnum, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum OtpPurpose {
  REGISTRATION = 'registration',
  LOGIN = 'login',
  PASSWORD_RESET = 'password_reset',
}

export class RequestOtpDto {
  @ApiProperty({
    example: '01712345678',
    description: 'Bangladeshi phone number',
  })
  @IsString()
  @Matches(/^(\+?880|0)1[3-9]\d{8}$/, {
    message: 'Phone must be a valid Bangladeshi mobile number',
  })
  phone: string;

  @ApiProperty({ enum: OtpPurpose, example: OtpPurpose.REGISTRATION })
  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;
}
