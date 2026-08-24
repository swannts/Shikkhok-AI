import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { SyncService } from './sync.service';
import { SubmitSyncBatchDto } from './dto/submit-sync-batch.dto';

@ApiTags('Sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('me/events')
  @ApiOperation({ summary: 'List my sync events' })
  async getMyEvents(@CurrentUser() user: AuthenticatedUser) {
    return this.syncService.getMySyncEvents(user);
  }

  @Post('me/batches')
  @ApiOperation({ summary: 'Submit an offline sync batch' })
  @ApiResponse({ status: 200, description: 'Sync batch processed' })
  async submitBatch(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitSyncBatchDto,
  ) {
    return this.syncService.submitBatch(user, dto);
  }
}
