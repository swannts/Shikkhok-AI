import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ArrayMaxSize,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { PracticeDifficulty } from '../../practice/enums/practice-difficulty.enum';
import { PracticeQuestionType } from '../../practice/enums/practice-question-type.enum';

export class AdminUpsertPracticeQuestionDto {
  @ApiProperty({ example: '64b8268b6cb348e3b53f7001' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ example: '64b8268b6cb348e3b53f7010' })
  @IsString()
  @IsNotEmpty()
  chapterId: string;

  @ApiProperty({ example: '64b8268b6cb348e3b53f7020' })
  @IsString()
  @IsNotEmpty()
  lessonId: string;

  @ApiProperty({ enum: PracticeQuestionType, example: PracticeQuestionType.MCQ })
  @IsEnum(PracticeQuestionType)
  questionType: PracticeQuestionType;

  @ApiProperty({ example: 'What is 2 + 2?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  prompt: string;

  @ApiPropertyOptional({ type: [String], example: ['algebra', 'basics'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ enum: PracticeDifficulty, example: PracticeDifficulty.EASY })
  @IsEnum(PracticeDifficulty)
  difficulty: PracticeDifficulty;

  @ApiPropertyOptional({ type: [String], example: ['A', 'B', 'C', 'D'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ type: [String], example: ['0'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  correctOptionIds?: string[];

  @ApiPropertyOptional({ type: [String], example: ['4', 'চার'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  acceptedAnswers?: string[];

  @ApiPropertyOptional({ example: { explanationBn: 'দুই আর দুই মিলে চার হয়' } })
  @IsOptional()
  @IsObject()
  answerConfig?: Record<string, any> | null;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
