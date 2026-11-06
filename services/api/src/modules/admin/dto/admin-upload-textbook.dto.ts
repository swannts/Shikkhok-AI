import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { CurriculumMedium } from '../../curriculum/enums/curriculum-medium.enum';

export class AdminUploadTextbookDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  titleBn: string;

  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  classLevel: number;

  @IsEnum(CurriculumMedium)
  medium: CurriculumMedium;

  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  curriculumYear: number;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9._-]{1,80}$/)
  curriculumVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  edition?: string;
}
