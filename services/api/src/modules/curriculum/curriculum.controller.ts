import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MongoObjectIdPipe } from '../../common/pipes/mongo-object-id.pipe';
import { CurriculumService } from './curriculum.service';
import { CurriculumQueryDto } from './dto/curriculum-query.dto';

@ApiTags('Curriculum')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'curriculum', version: '1' })
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Get('subjects')
  @ApiOperation({ summary: 'List published subjects for a class, medium, and curriculum year' })
  @ApiResponse({ status: 200, description: 'Subject list returned' })
  async listSubjects(@Query() query: CurriculumQueryDto) {
    return this.curriculumService.listSubjects(query);
  }

  @Get('subjects/:subjectId')
  @ApiOperation({ summary: 'Get a subject by ID' })
  @ApiResponse({ status: 200, description: 'Subject returned' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  async getSubject(@Param('subjectId', MongoObjectIdPipe) subjectId: string) {
    return this.curriculumService.getSubject(subjectId);
  }

  @Get('subjects/:subjectId/chapters')
  @ApiOperation({ summary: 'List published chapters for a subject' })
  @ApiResponse({ status: 200, description: 'Chapter list returned' })
  async listChapters(@Param('subjectId', MongoObjectIdPipe) subjectId: string) {
    return this.curriculumService.listChapters(subjectId);
  }

  @Get('chapters/:chapterId')
  @ApiOperation({ summary: 'Get a chapter by ID' })
  @ApiResponse({ status: 200, description: 'Chapter returned' })
  @ApiResponse({ status: 404, description: 'Chapter not found' })
  async getChapter(@Param('chapterId', MongoObjectIdPipe) chapterId: string) {
    return this.curriculumService.getChapter(chapterId);
  }

  @Get('chapters/:chapterId/lessons')
  @ApiOperation({ summary: 'List published lessons for a chapter' })
  @ApiResponse({ status: 200, description: 'Lesson list returned' })
  async listLessons(@Param('chapterId', MongoObjectIdPipe) chapterId: string) {
    return this.curriculumService.listLessons(chapterId);
  }

  @Get('lessons/:lessonId')
  @ApiOperation({ summary: 'Get a lesson by ID' })
  @ApiResponse({ status: 200, description: 'Lesson returned' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async getLesson(@Param('lessonId', MongoObjectIdPipe) lessonId: string) {
    return this.curriculumService.getLesson(lessonId);
  }
}
