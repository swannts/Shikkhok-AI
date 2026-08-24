import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Max,
  Min,
  MaxLength,
} from 'class-validator';
import { StudentMedium } from '../enums/student-medium.enum';

export class UpsertStudentProfileDto {
  @ApiProperty({ example: 8, minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  classLevel: number;

  @ApiProperty({ enum: StudentMedium, example: StudentMedium.BANGLA })
  @IsEnum(StudentMedium)
  medium: StudentMedium;

  @ApiProperty({ example: 2026, minimum: 2020, maximum: 2100 })
  @IsInt()
  @Min(2020)
  @Max(2100)
  curriculumYear: number;

  @ApiPropertyOptional({ example: 'Dhaka Residential Model College' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  schoolName?: string;

  @ApiPropertyOptional({ example: 'Dhaka' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  district?: string;

  @ApiPropertyOptional({ example: 'Dhanmondi' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  upazila?: string;

  @ApiPropertyOptional({ example: 'Dhaka Board' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  board?: string;

  @ApiPropertyOptional({ example: 'science' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  academicStream?: string;

  @ApiPropertyOptional({ example: '+8801712345678' })
  @IsOptional()
  @IsPhoneNumber('BD')
  guardianPhone?: string;

  @ApiPropertyOptional({
    example: ['math', 'english'],
    description: 'Subjects the learner wants to prioritize',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  preferredSubjects?: string[];

  @ApiPropertyOptional({
    example: ['raise math score', 'prepare for school exam'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  learningGoals?: string[];

  @ApiPropertyOptional({ example: '2012-05-17' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
