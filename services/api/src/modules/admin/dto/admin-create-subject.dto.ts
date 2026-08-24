import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { CurriculumMedium } from '../../curriculum/enums/curriculum-medium.enum';

export class AdminCreateSubjectDto {
  @ApiProperty({ example: 8, minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  classLevel: number;

  @ApiProperty({ enum: CurriculumMedium, default: CurriculumMedium.BANGLA })
  @IsEnum(CurriculumMedium)
  medium: CurriculumMedium;

  @ApiProperty({ example: 2026, minimum: 2020, maximum: 2100 })
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  curriculumYear: number;

  @ApiProperty({ example: 'Mathematics' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'math-8-bangla' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: 'Class 8 NCTB Mathematics curriculum' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
