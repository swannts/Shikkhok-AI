import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { CurriculumMedium } from '../../curriculum/enums/curriculum-medium.enum';

export class AdminListCurriculumQueryDto {
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

  @ApiPropertyOptional({ enum: CurriculumMedium, example: CurriculumMedium.BANGLA })
  @IsOptional()
  @IsEnum(CurriculumMedium)
  medium?: CurriculumMedium;

  @ApiPropertyOptional({ example: 2026, minimum: 2020, maximum: 2100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  curriculumYear?: number;

  @ApiPropertyOptional({ example: '64b8268b6cb348e3b53f7001' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ example: '64b8268b6cb348e3b53f7010' })
  @IsOptional()
  @IsString()
  chapterId?: string;

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

  @ApiPropertyOptional({ example: 'order', description: 'Field to sort by' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ example: 'asc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
