import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ContentWorkflowStatus } from '../../curriculum/enums/content-workflow-status.enum';

export class TransitionLessonWorkflowDto {
  @ApiProperty({ enum: ContentWorkflowStatus })
  @IsEnum(ContentWorkflowStatus)
  status: ContentWorkflowStatus;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewComments?: string;
}
