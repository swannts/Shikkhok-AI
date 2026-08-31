import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PracticeDifficulty } from '../../practice/enums/practice-difficulty.enum';
import { PracticeQuestionType } from '../../practice/enums/practice-question-type.enum';

export class AdminListPracticeQuestionsQueryDto {
  @ApiPropertyOptional({ example: 'algebra' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 8, minimum: 1, maximum: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  classLevel?: number;

  @ApiPropertyOptional({ example: '64b8268b6cb348e3b53f7001' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ example: '64b8268b6cb348e3b53f7010' })
  @IsOptional()
  @IsString()
  chapterId?: string;

  @ApiPropertyOptional({ example: '64b8268b6cb348e3b53f7020' })
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiPropertyOptional({ enum: PracticeQuestionType })
  @IsOptional()
  @IsEnum(PracticeQuestionType)
  questionType?: PracticeQuestionType;

  @ApiPropertyOptional({ enum: PracticeDifficulty })
  @IsOptional()
  @IsEnum(PracticeDifficulty)
  difficulty?: PracticeDifficulty;

  @ApiPropertyOptional({ enum: ['published', 'draft'], example: 'published' })
  @IsOptional()
  @IsString()
  status?: 'published' | 'draft';

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 'createdAt', description: 'Field to sort by' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
