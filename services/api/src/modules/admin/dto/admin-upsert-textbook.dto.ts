import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class AdminUpsertTextbookDto {
  @ApiProperty({ example: 'Bangla Textbook for Class 8' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'বাংলা পাঠ্যবই - অষ্টম শ্রেণি' })
  @IsString()
  @IsNotEmpty()
  titleBn: string;

  @ApiProperty({ example: '64b8268b6cb348e3b53f7001' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

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

  @ApiPropertyOptional({ example: '2026 Revised Edition' })
  @IsOptional()
  @IsString()
  edition?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/covers/class-8-bangla.jpg' })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/books/class-8-bangla.pdf' })
  @IsOptional()
  @IsString()
  pdfUrl?: string;

  @ApiPropertyOptional({ example: 12, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalChapters?: number;

  @ApiPropertyOptional({ example: 64, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalLessons?: number;

  @ApiPropertyOptional({ example: 15728640, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fileSizeBytes?: number;

  @ApiPropertyOptional({ example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' })
  @IsOptional()
  @IsString()
  checksumSha256?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
