import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchSuggestionsQueryDto } from './dto/search-suggestions-query.dto';

@ApiTags('Search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'search', version: '1' })
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Unified search across subjects, chapters, lessons, textbooks, and practice questions',
  })
  @ApiResponse({
    status: 200,
    description: 'Structured search results filtered by student grade and curriculum',
  })
  async search(@CurrentUser() user: AuthenticatedUser, @Query() query: SearchQueryDto) {
    return this.searchService.search(user, query);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get instant autocomplete suggestions for search bar' })
  @ApiResponse({ status: 200, description: 'List of query autocomplete suggestions' })
  async getSuggestions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SearchSuggestionsQueryDto,
  ) {
    return this.searchService.getSuggestions(user, query);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get trending and popular search queries for grade level' })
  @ApiQuery({ name: 'classLevel', required: false, type: Number })
  async getPopular(
    @CurrentUser() user: AuthenticatedUser,
    @Query('classLevel') classLevel?: string,
  ) {
    return this.searchService.getPopular(user, classLevel ? Number(classLevel) : undefined);
  }
}
