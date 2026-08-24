import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdminCreateLessonDto {
  @ApiProperty({ example: '64b8268b6cb348e3b53f8001', description: 'Chapter ObjectId' })
  @IsString()
  @IsNotEmpty()
  chapterId: string;

  @ApiProperty({ example: 'বর্গ নির্ণয়ের সূত্রাবলি' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'square-formulas' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: '(a+b)^2 ও (a-b)^2 সূত্রের প্রয়োগ' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ example: 'NCTB Class 8 Math Chapter 4 Page 54-58' })
  @IsOptional()
  @IsString()
  textbookReference?: string;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ example: 54 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageStart?: number;

  @ApiPropertyOptional({ example: 58 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageEnd?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
