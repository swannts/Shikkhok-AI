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

export class SearchQueryDto {
  @ApiProperty({ example: 'বীজগণিত', description: 'Search term or keywords' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  q: string;

  @ApiPropertyOptional({ example: 8, minimum: 1, maximum: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  classLevel?: number;

  @ApiPropertyOptional({ example: 'bangla' })
  @IsOptional()
  @IsString()
  medium?: string;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
