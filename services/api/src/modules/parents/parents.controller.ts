import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MongoObjectIdPipe } from '../../common/pipes/mongo-object-id.pipe';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { ParentsService } from './parents.service';
import { UpsertParentProfileDto } from './dto/upsert-parent-profile.dto';
import { LinkChildDto } from './dto/link-child.dto';

@ApiTags('Parents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get authenticated parent profile' })
  @ApiResponse({ status: 200, description: 'Parent profile returned' })
  async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.parentsService.getMyProfile(user);
  }

  @Put('me')
  @ApiOperation({ summary: 'Create or update authenticated parent profile' })
  @ApiResponse({ status: 200, description: 'Parent profile saved successfully' })
  async upsertMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertParentProfileDto,
  ) {
    return this.parentsService.upsertMyProfile(user, dto);
  }

  @Get('me/children')
  @ApiOperation({ summary: 'List linked child accounts with dashboard summaries' })
  @ApiResponse({ status: 200, description: 'Linked children returned' })
  async listLinkedChildren(@CurrentUser() user: AuthenticatedUser) {
    return this.parentsService.listLinkedChildren(user);
  }

  @Post('me/children/link')
  @ApiOperation({ summary: 'Link a child account using ID, phone, or email' })
  @ApiResponse({ status: 200, description: 'Child linked successfully' })
  async linkChild(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LinkChildDto,
  ) {
    return this.parentsService.linkChild(user, dto);
  }

  @Delete('me/children/:childUserId')
  @ApiOperation({ summary: 'Unlink a child account' })
  @ApiResponse({ status: 200, description: 'Child unlinked successfully' })
  async unlinkChild(
    @CurrentUser() user: AuthenticatedUser,
    @Param('childUserId', MongoObjectIdPipe) childUserId: string,
  ) {
    return this.parentsService.unlinkChild(user, childUserId);
  }

  @Get('me/children/:childUserId/dashboard')
  @ApiOperation({ summary: 'Get a linked child dashboard summary' })
  @ApiResponse({ status: 200, description: 'Child dashboard returned' })
  async getChildDashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Param('childUserId', MongoObjectIdPipe) childUserId: string,
  ) {
    return this.parentsService.getChildDashboard(user, childUserId);
  }
}
