import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { SyncOperationType } from '../enums/sync-operation-type.enum';

export class SyncOperationDto {
  @ApiProperty({ example: 'op-001', description: 'Client-generated UUID for the sync operation' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  operationId: string;

  @ApiProperty({ enum: SyncOperationType, example: SyncOperationType.LESSON_PROGRESS_UPSERT })
  @IsEnum(SyncOperationType)
  operationType: SyncOperationType;

  @ApiProperty({ example: 'lesson_progress', description: 'Target entity type' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  entityType: string;

  @ApiPropertyOptional({ example: '64b8268b6cb348e3b53f9901' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  entityId?: string;

  @ApiProperty({ example: { lessonId: '64b8268b6cb348e3b53f9902', progressPercent: 50 } })
  @IsObject()
  payload: Record<string, any>;
}

export class SubmitSyncBatchDto {
  @ApiProperty({ example: 'device-uuid-1234', description: 'Client device unique identifier' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  deviceId: string;

  @ApiProperty({
    type: [SyncOperationDto],
    description: 'List of offline operations to apply in order',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SyncOperationDto)
  operations: SyncOperationDto[];
}

export class SyncBatchSummaryDto {
  @ApiProperty({ example: 3, description: 'Total operations received in the batch' })
  received: number;

  @ApiProperty({ example: 2, description: 'Operations successfully executed and applied' })
  applied: number;

  @ApiProperty({ example: 1, description: 'Operations previously applied and replayed' })
  replayed: number;

  @ApiProperty({ example: 0, description: 'Operations currently processing concurrently' })
  processing: number;

  @ApiProperty({ example: 0, description: 'Operations that failed during execution' })
  failed: number;
}

export class SyncOperationResultDto {
  @ApiProperty({ example: 'op-001' })
  operationId: string;

  @ApiProperty({ enum: ['applied', 'replayed', 'processing', 'failed'], example: 'applied' })
  status: 'applied' | 'replayed' | 'processing' | 'failed';

  @ApiPropertyOptional({ example: { ok: true } })
  result?: Record<string, any> | null;

  @ApiPropertyOptional({ example: 'FORBIDDEN' })
  errorCode?: string | null;

  @ApiPropertyOptional({ example: 'Only student accounts can update lesson progress' })
  errorMessage?: string | null;
}

export class SubmitSyncBatchResponseDto {
  @ApiProperty({ type: SyncBatchSummaryDto })
  summary: SyncBatchSummaryDto;

  @ApiProperty({ type: [SyncOperationResultDto] })
  results: SyncOperationResultDto[];
}
