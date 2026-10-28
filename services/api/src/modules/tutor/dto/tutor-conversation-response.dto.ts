import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TutorMessageRole } from '../enums/tutor-message-role.enum';
import { TutorCitation } from '../types/tutor-citation.type';

export class TutorTokenUsageDto {
  @ApiProperty({ example: 45 })
  promptTokens: number;

  @ApiProperty({ example: 120 })
  completionTokens: number;

  @ApiProperty({ example: 165 })
  totalTokens: number;
}

export class TutorCitationDto implements TutorCitation {
  @ApiPropertyOptional({ example: 'chunk-123' })
  sourceId?: string;

  @ApiProperty({ example: 'বিজ্ঞান ৮ম শ্রেণি' })
  sourceBook: string;

  @ApiPropertyOptional({ example: 8 })
  classLevel?: number;

  @ApiPropertyOptional({ example: 'বিজ্ঞান' })
  subject?: string;

  @ApiPropertyOptional({ example: 'প্রথম অধ্যায়: প্রাণীজগতের শ্রেণিবিন্যাস' })
  chapter?: string;

  @ApiPropertyOptional({ example: 14 })
  pageNumber?: number;

  @ApiPropertyOptional({ example: 'অমেরুদণ্ডী প্রাণীদের বৈশিষ্ট্য...' })
  excerpt?: string;

  @ApiPropertyOptional({ example: 'https://storage.shikkhok.ai/nctb/class8-science.pdf#page=14' })
  sourceUrl?: string;
}

export class TutorMessageResponseDto {
  @ApiProperty({ example: '66f3e1b7a1234567890abcde' })
  _id: string;

  @ApiProperty({ example: '66f3e1b7a1234567890abc01' })
  conversationId: string;

  @ApiProperty({ example: '66f3e1b7a1234567890abc02' })
  userId: string;

  @ApiProperty({ enum: TutorMessageRole, example: TutorMessageRole.ASSISTANT })
  role: TutorMessageRole;

  @ApiProperty({ example: 'সালোকসংশ্লেষণ হলো একটি জৈব রাসায়নিক প্রক্রিয়া...' })
  content: string;

  @ApiPropertyOptional({ type: [TutorCitationDto] })
  citations?: TutorCitationDto[];

  @ApiPropertyOptional({ example: 'gemini' })
  provider?: string | null;

  @ApiPropertyOptional({ type: TutorTokenUsageDto })
  tokenUsage?: TutorTokenUsageDto | null;

  @ApiProperty({ example: '2026-10-28T02:00:00.000Z' })
  createdAt: string | Date;

  @ApiProperty({ example: '2026-10-28T02:00:00.000Z' })
  updatedAt: string | Date;
}

export class TutorConversationResponseDto {
  @ApiProperty({ example: '66f3e1b7a1234567890abc01' })
  _id: string;

  @ApiProperty({ example: '66f3e1b7a1234567890abc02' })
  userId: string;

  @ApiProperty({ example: 'বীজগণিতের সূত্রাবলি আলোচনা' })
  title: string;

  @ApiPropertyOptional({ example: '64b8268b6cb348e3b53f8001' })
  subjectId?: string | null;

  @ApiPropertyOptional({ example: '64b8268b6cb348e3b53f8002' })
  chapterId?: string | null;

  @ApiPropertyOptional({ example: '64b8268b6cb348e3b53f8003' })
  lessonId?: string | null;

  @ApiProperty({ example: 8 })
  classLevel: number;

  @ApiPropertyOptional({ example: 'bangla' })
  medium?: string;

  @ApiProperty({ example: '2026' })
  curriculumYear: string;

  @ApiProperty({ example: 4 })
  messageCount: number;

  @ApiProperty({ example: '2026-10-28T02:05:00.000Z' })
  lastMessageAt: string | Date;

  @ApiProperty({ example: '2026-10-28T02:00:00.000Z' })
  createdAt: string | Date;

  @ApiProperty({ example: '2026-10-28T02:05:00.000Z' })
  updatedAt: string | Date;
}

export class PaginationMetaDto {
  @ApiPropertyOptional({ example: 30 })
  limit?: number;

  @ApiPropertyOptional({ example: 'eyJjcmVhdGVkQXQiOiIyMDI2LTEwLTI4VDAyOjAwOjAwLjAwMFoiLCJpZCI6IjY2ZjNlMWI3YTEyMzQ1Njc4OTBhYmNkZSJ9', nullable: true })
  nextCursor: string | null;

  @ApiProperty({ example: false })
  hasNext: boolean;
}

export class PaginatedTutorMessagesDto {
  @ApiProperty({ type: [TutorMessageResponseDto] })
  data: TutorMessageResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class PaginatedTutorConversationsDto {
  @ApiProperty({ type: [TutorConversationResponseDto] })
  data: TutorConversationResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class TutorConversationDetailResponseDto extends TutorConversationResponseDto {
  @ApiProperty({ type: [TutorMessageResponseDto] })
  messages: TutorMessageResponseDto[];

  @ApiPropertyOptional({ type: PaginationMetaDto })
  messageMeta?: PaginationMetaDto;
}

