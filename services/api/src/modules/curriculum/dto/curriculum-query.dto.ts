import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { CurriculumMedium } from '../enums/curriculum-medium.enum';

export class CurriculumQueryDto {
  @ApiProperty({ example: 8, minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  classLevel: number;

  @ApiProperty({ enum: CurriculumMedium, example: CurriculumMedium.BANGLA })
  @IsEnum(CurriculumMedium)
  medium: CurriculumMedium;

  @ApiProperty({ example: 2026, minimum: 2020, maximum: 2100 })
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  curriculumYear: number;
}
