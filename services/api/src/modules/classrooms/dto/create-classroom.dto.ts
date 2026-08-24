import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateClassroomDto {
  @ApiProperty({ example: 'অষ্টম শ্রেণি গণিত - ক শাখা' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 8, minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  classLevel: number;

  @ApiPropertyOptional({ example: 'bangla' })
  @IsOptional()
  @IsString()
  medium?: string;

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

  @ApiPropertyOptional({ example: 'Class 8 Section A Mathematics classroom' })
  @IsOptional()
  @IsString()
  description?: string;
}
