import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class FlagExamQuestionDto {
  @ApiPropertyOptional({ example: true, description: 'True to flag for review, false to unflag' })
  @IsOptional()
  @IsBoolean()
  flagged?: boolean;
}
