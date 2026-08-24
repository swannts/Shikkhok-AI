import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { StudyPlanStatus } from '../enums/study-plan-status.enum';

class StudyPlanItemDto {
  @ApiProperty({ example: 'দৈনিক গণিত অনুশীলন' })
  @IsString()
  @MaxLength(120)
  title: string;

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

  @ApiProperty({ example: 45, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  targetMinutes: number;

  @ApiPropertyOptional({ example: 'ভিত্তি শক্ত করো' })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

export class UpsertStudyPlanDto {
  @ApiProperty({ example: 'সাপ্তাহিক অধ্যয়ন পরিকল্পনা' })
  @IsString()
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional({ example: 'গণিত ও বিজ্ঞানে দুর্বলতা কমানোর লক্ষ্য' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: StudyPlanStatus, example: StudyPlanStatus.ACTIVE })
  @IsOptional()
  @IsEnum(StudyPlanStatus)
  status?: StudyPlanStatus;

  @ApiProperty({ example: 8, minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  classLevel: number;

  @ApiProperty({ example: 'bangla' })
  @IsString()
  medium: string;

  @ApiProperty({ example: 2026, minimum: 2020, maximum: 2100 })
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  curriculumYear: number;

  @ApiPropertyOptional({ example: 420, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  weeklyTargetMinutes?: number;

  @ApiPropertyOptional({ example: 60, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  dailyTargetMinutes?: number;

  @ApiPropertyOptional({ example: ['64b8268b6cb348e3b53f7001'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focusSubjectIds?: string[];

  @ApiPropertyOptional({ example: ['64b8268b6cb348e3b53f7002'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focusChapterIds?: string[];

  @ApiPropertyOptional({ example: ['64b8268b6cb348e3b53f7003'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focusLessonIds?: string[];

  @ApiPropertyOptional({ example: '2026-08-24T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ example: '2026-08-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ type: [StudyPlanItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  items?: StudyPlanItemDto[];
}
