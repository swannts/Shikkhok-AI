import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class RecordActivityDto {
  @ApiPropertyOptional({
    example: '2026-08-24',
    description: 'Activity date in YYYY-MM-DD format (defaults to server today)',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
