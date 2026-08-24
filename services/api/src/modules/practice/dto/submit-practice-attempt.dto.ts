import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PracticeQuestionType } from '../enums/practice-question-type.enum';

export class SubmitPracticeAttemptDto {
  @ApiProperty({ example: '64b8268b6cb348e3b53f3111' })
  @IsString()
  questionId: string;

  @ApiPropertyOptional({ example: '64b8268b6cb348e3b53f3112' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiProperty({ enum: PracticeQuestionType, example: PracticeQuestionType.MCQ })
  @IsEnum(PracticeQuestionType)
  questionType: PracticeQuestionType;

  @ApiPropertyOptional({ example: 'option-a' })
  @IsOptional()
  @IsString()
  selectedOptionId?: string;

  @ApiPropertyOptional({ example: ['option-a', 'option-c'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedOptionIds?: string[];

  @ApiPropertyOptional({ example: '৮' })
  @IsOptional()
  @IsString()
  textAnswer?: string;

  @ApiPropertyOptional({ example: 8.5 })
  @IsOptional()
  @IsNumber()
  numericAnswer?: number;

  @ApiPropertyOptional({ example: { left1: 'right2', left2: 'right1' } })
  @IsOptional()
  @IsObject()
  matchingAnswer?: Record<string, string>;

  @ApiPropertyOptional({ example: 120, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  timeSpentSeconds?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  allowPartialCredit?: boolean;
}
