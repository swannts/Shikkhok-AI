import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { AssignmentType } from '../enums/assignment-type.enum';

export class CreateAssignmentDto {
  @ApiProperty({ example: 'অনুশীলনী ৩.১ এর ১-১০ নং অঙ্ক' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example: 'বীজগণিতীয় রাশির সূত্রের সাহায্যে মান নির্ণয় করে খাতার ছবি জমা দিন।',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: AssignmentType, default: AssignmentType.HOMEWORK })
  @IsOptional()
  @IsEnum(AssignmentType)
  assignmentType?: AssignmentType;

  @ApiPropertyOptional({ example: '64b8268b6cb348e3b53f7001' })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiProperty({ example: '2026-08-30T23:59:59.000Z' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ example: 100, minimum: 1, maximum: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  maxScore?: number;
}
