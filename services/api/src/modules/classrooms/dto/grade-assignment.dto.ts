import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class GradeAssignmentDto {
  @ApiProperty({ example: 90, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  score: number;

  @ApiPropertyOptional({
    example:
      'অঙ্কগুলো খুব সুন্দর ও নির্ভুল হয়েছে। ৮ নং অঙ্কে একটু আরও বিস্তারিত ধাপ লিখলে ভালো হতো।',
  })
  @IsOptional()
  @IsString()
  teacherFeedback?: string;
}
