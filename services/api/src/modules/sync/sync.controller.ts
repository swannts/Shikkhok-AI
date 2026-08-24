import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { SyncService } from './sync.service';
import { SubmitSyncBatchDto, SubmitSyncBatchResponseDto } from './dto/submit-sync-batch.dto';

@ApiTags('Sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'sync', version: '1' })
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('me/events')
  @ApiOperation({ summary: 'List my sync events' })
  @ApiResponse({ status: 200, description: 'List of sync events for current user' })
  async getMyEvents(@CurrentUser() user: AuthenticatedUser) {
    return this.syncService.getMySyncEvents(user);
  }

  @Get('me/checkpoints/:deviceId')
  @ApiOperation({ summary: 'Get my sync checkpoint for a device' })
  @ApiResponse({ status: 200, description: 'Sync checkpoint for device' })
  async getMyCheckpoint(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deviceId') deviceId: string,
  ) {
    return this.syncService.getMySyncCheckpoint(user, deviceId);
  }

  @Post('me/batches')
  @ApiOperation({ summary: 'Submit an offline sync batch' })
  @ApiResponse({
    status: 200,
    description: 'Sync batch processed with summary and per-operation status',
    type: SubmitSyncBatchResponseDto,
  })
  async submitBatch(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitSyncBatchDto,
  ): Promise<SubmitSyncBatchResponseDto> {
    return this.syncService.submitBatch(user, dto);
  }
}
