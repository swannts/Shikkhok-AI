import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MongoObjectIdPipe } from '../../common/pipes/mongo-object-id.pipe';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { TextbooksService } from './textbooks.service';
import { ListTextbooksQueryDto } from './dto/list-textbooks-query.dto';
import { ManifestBundleQueryDto } from './dto/manifest-bundle-query.dto';

@ApiTags('Textbooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'textbooks', version: '1' })
export class TextbooksController {
  constructor(private readonly textbooksService: TextbooksService) {}

  @Get()
  @ApiOperation({ summary: 'List published NCTB textbooks matching student curriculum' })
  async listTextbooks(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListTextbooksQueryDto,
  ) {
    return this.textbooksService.listTextbooks(user, query);
  }

  @Get('manifests/bundle')
  @ApiOperation({ summary: 'Get 1-click batch download manifest bundle for all grade textbooks' })
  @ApiResponse({
    status: 200,
    description: 'Manifest package bundle for Flutter offline synchronization',
  })
  async getManifestBundle(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ManifestBundleQueryDto,
  ) {
    return this.textbooksService.getManifestBundle(user, query);
  }

  @Get(':textbookId')
  @ApiOperation({ summary: 'Get textbook metadata and chapter summary by ID' })
  async getTextbook(
    @CurrentUser() user: AuthenticatedUser,
    @Param('textbookId', MongoObjectIdPipe) textbookId: string,
  ) {
    return this.textbooksService.getTextbook(user, textbookId);
  }

  @Get(':textbookId/manifest')
  @ApiOperation({ summary: 'Get offline download manifest and checksum for a specific textbook' })
  async getTextbookManifest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('textbookId', MongoObjectIdPipe) textbookId: string,
  ) {
    return this.textbooksService.getTextbookManifest(user, textbookId);
  }
}
