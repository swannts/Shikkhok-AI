import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { SyncOperationType } from '../enums/sync-operation-type.enum';

class SyncOperationDto {
  @ApiProperty({ example: 'op-001' })
  @IsString()
  @MaxLength(120)
  operationId: string;

  @ApiProperty({ enum: SyncOperationType, example: SyncOperationType.LESSON_PROGRESS_UPSERT })
  @IsEnum(SyncOperationType)
  operationType: SyncOperationType;

  @ApiProperty({ example: 'lesson_progress' })
  @IsString()
  @MaxLength(60)
  entityType: string;

  @ApiProperty({ example: '64b8268b6cb348e3b53f9901' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ example: { lessonId: '64b8268b6cb348e3b53f9902', progressPercent: 50 } })
  @IsObject()
  payload: Record<string, any>;
}

export class SubmitSyncBatchDto {
  @ApiProperty({ example: 'device-1' })
  @IsString()
  @MaxLength(120)
  deviceId: string;

  @ApiProperty({ type: [SyncOperationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncOperationDto)
  operations: SyncOperationDto[];
}
