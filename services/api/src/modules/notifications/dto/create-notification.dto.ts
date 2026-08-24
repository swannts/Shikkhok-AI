import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { NotificationType } from '../enums/notification-type.enum';

export class CreateNotificationDto {
  @ApiProperty({ enum: NotificationType, example: NotificationType.SYSTEM })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'নতুন অধ্যয়ন পরিকল্পনা তৈরি হয়েছে' })
  @IsString()
  @MaxLength(120)
  title: string;

  @ApiProperty({ example: 'তোমার জন্য একটি নতুন পরিকল্পনা প্রস্তুত করা হয়েছে' })
  @IsString()
  @MaxLength(1000)
  body: string;

  @ApiPropertyOptional({ example: { planId: 'plan-1' } })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}
