import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class AdminCreateChapterDto {
  @ApiProperty({ example: '64b8268b6cb348e3b53f7001', description: 'Subject ObjectId' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ example: 'বীজগণিতীয় রাশি' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'algebraic-expressions' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: 'বর্গ ও ঘনের সম্প্রসারণ এবং উৎপাদক বিশ্লেষণ' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estimatedMinutes?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
