import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class StartTutorConversationDto {
  @ApiPropertyOptional({ example: 'বীজগণিতের প্রথম পাঠ' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({ example: '64b8268b6cb348e3b53f8001' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ example: '64b8268b6cb348e3b53f8002' })
  @IsOptional()
  @IsString()
  chapterId?: string;

  @ApiPropertyOptional({ example: '64b8268b6cb348e3b53f8003' })
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiPropertyOptional({ example: 'আমি এই অধ্যায় বুঝতে চাই' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  initialMessage?: string;
}
