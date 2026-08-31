import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { CurriculumMedium } from '../../curriculum/enums/curriculum-medium.enum';
import { ExamStatus } from '../../exams/enums/exam-status.enum';

export class AdminUpsertExamDto {
  @ApiProperty({ example: 'Class 8 Mathematics Midterm' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'অষ্টম শ্রেণি গণিত মধ্যম পরীক্ষা' })
  @IsString()
  @IsNotEmpty()
  titleBn: string;

  @ApiProperty({ example: '64b8268b6cb348e3b53f7001' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiPropertyOptional({ type: [String], example: ['64b8268b6cb348e3b53f7010'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  chapterIds?: string[];

  @ApiProperty({ example: 8, minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  classLevel: number;

  @ApiProperty({ enum: CurriculumMedium, example: CurriculumMedium.BANGLA })
  @IsEnum(CurriculumMedium)
  medium: CurriculumMedium;

  @ApiProperty({ example: 2026, minimum: 2020, maximum: 2100 })
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  curriculumYear: number;

  @ApiProperty({ type: [String], example: ['64b8268b6cb348e3b53f7021'] })
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  questionIds: string[];

  @ApiProperty({ example: 60, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  timeLimitMinutes: number;

  @ApiProperty({ example: 100, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalMarks: number;

  @ApiPropertyOptional({ example: 40, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  passMarks?: number | null;

  @ApiPropertyOptional({ example: 'Read all questions carefully' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ enum: ExamStatus, example: ExamStatus.DRAFT })
  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;
}
