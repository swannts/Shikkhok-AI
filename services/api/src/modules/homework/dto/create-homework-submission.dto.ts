import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateHomeworkSubmissionDto {
  @ApiProperty({
    example: ['https://storage.shikkhok.ai/homework/img1.jpg'],
    description: 'Array of image URLs for the student homework',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  imageUrls: string[];

  @ApiPropertyOptional({
    example: 'অনুগ্রহ করে ৩ নম্বর গণিতটির সমাধান ও ধাপগুলো ঠিক আছে কিনা দেখুন।',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  prompt?: string;

  @ApiPropertyOptional({ example: '64b8268b6cb348e3b53f7001' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ example: '64b8268b6cb348e3b53f7002' })
  @IsOptional()
  @IsString()
  chapterId?: string;

  @ApiPropertyOptional({ example: '64b8268b6cb348e3b53f7003' })
  @IsOptional()
  @IsString()
  lessonId?: string;
}
