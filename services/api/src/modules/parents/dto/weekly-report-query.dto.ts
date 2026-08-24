import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class WeeklyReportQueryDto {
  @ApiPropertyOptional({
    example: 7,
    minimum: 7,
    maximum: 30,
    description: 'Number of past days to aggregate (default 7)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(30)
  days?: number;
}
