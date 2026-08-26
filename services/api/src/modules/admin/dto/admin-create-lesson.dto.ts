import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Max,
  Min,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  LESSON_CONTENT_BLOCK_MAX_COUNT,
  LESSON_CONTENT_BLOCK_MAX_IMAGE_URL_LENGTH,
  LESSON_CONTENT_BLOCK_MAX_SHORT_TEXT_LENGTH,
  LESSON_CONTENT_BLOCK_MAX_TEXT_LENGTH,
  LESSON_CONTENT_BLOCK_MAX_TABLE_COLUMNS,
  LESSON_CONTENT_BLOCK_MAX_TABLE_ROWS,
  LessonContentBlockType,
  LessonImportantNoteSeverity,
} from '../../curriculum/types/lesson-content-block';

export class AdminLessonContentBlockDto {
  @ApiProperty({ example: 'b1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  id: string;

  @ApiProperty({ enum: LessonContentBlockType, example: LessonContentBlockType.HEADING })
  @IsEnum(LessonContentBlockType)
  type: LessonContentBlockType;

  @ApiProperty({ example: 1, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order: number;
}

export class AdminLessonHeadingBlockDto extends AdminLessonContentBlockDto {
  @ApiProperty({
    enum: LessonContentBlockType,
    default: LessonContentBlockType.HEADING,
    example: LessonContentBlockType.HEADING,
  })
  type: LessonContentBlockType.HEADING = LessonContentBlockType.HEADING;

  @ApiProperty({ example: 'বীজগণিতীয় সূত্রাবলি' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(LESSON_CONTENT_BLOCK_MAX_SHORT_TEXT_LENGTH)
  text: string;

  @ApiProperty({ enum: [1, 2, 3], example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  level: 1 | 2 | 3;
}

export class AdminLessonParagraphBlockDto extends AdminLessonContentBlockDto {
  @ApiProperty({
    enum: LessonContentBlockType,
    default: LessonContentBlockType.PARAGRAPH,
    example: LessonContentBlockType.PARAGRAPH,
  })
  type: LessonContentBlockType.PARAGRAPH = LessonContentBlockType.PARAGRAPH;

  @ApiProperty({ example: '...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(LESSON_CONTENT_BLOCK_MAX_TEXT_LENGTH)
  text: string;
}

export class AdminLessonFormulaBlockDto extends AdminLessonContentBlockDto {
  @ApiProperty({
    enum: LessonContentBlockType,
    default: LessonContentBlockType.FORMULA,
    example: LessonContentBlockType.FORMULA,
  })
  type: LessonContentBlockType.FORMULA = LessonContentBlockType.FORMULA;

  @ApiProperty({ example: '(a+b)^2 = a^2 + 2ab + b^2' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(LESSON_CONTENT_BLOCK_MAX_SHORT_TEXT_LENGTH)
  expression: string;

  @ApiPropertyOptional({ example: 'দুই পদের যোগের বর্গ' })
  @IsOptional()
  @IsString()
  @MaxLength(LESSON_CONTENT_BLOCK_MAX_SHORT_TEXT_LENGTH)
  description?: string;
}

export class AdminLessonExampleBlockDto extends AdminLessonContentBlockDto {
  @ApiProperty({
    enum: LessonContentBlockType,
    default: LessonContentBlockType.EXAMPLE,
    example: LessonContentBlockType.EXAMPLE,
  })
  type: LessonContentBlockType.EXAMPLE = LessonContentBlockType.EXAMPLE;

  @ApiPropertyOptional({ example: 'উদাহরণ' })
  @IsOptional()
  @IsString()
  @MaxLength(LESSON_CONTENT_BLOCK_MAX_SHORT_TEXT_LENGTH)
  title?: string;

  @ApiProperty({ example: 'যদি a = 2 এবং b = 3 হয়...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(LESSON_CONTENT_BLOCK_MAX_TEXT_LENGTH)
  body: string;

  @ApiPropertyOptional({ example: '...' })
  @IsOptional()
  @IsString()
  @MaxLength(LESSON_CONTENT_BLOCK_MAX_TEXT_LENGTH)
  solution?: string;
}

export class AdminLessonImportantNoteBlockDto extends AdminLessonContentBlockDto {
  @ApiProperty({
    enum: LessonContentBlockType,
    default: LessonContentBlockType.IMPORTANT_NOTE,
    example: LessonContentBlockType.IMPORTANT_NOTE,
  })
  type: LessonContentBlockType.IMPORTANT_NOTE = LessonContentBlockType.IMPORTANT_NOTE;

  @ApiPropertyOptional({ example: 'মনে রাখবে' })
  @IsOptional()
  @IsString()
  @MaxLength(LESSON_CONTENT_BLOCK_MAX_SHORT_TEXT_LENGTH)
  title?: string;

  @ApiProperty({ example: '...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(LESSON_CONTENT_BLOCK_MAX_TEXT_LENGTH)
  text: string;

  @ApiProperty({ enum: LessonImportantNoteSeverity, example: LessonImportantNoteSeverity.TIP })
  @IsEnum(LessonImportantNoteSeverity)
  severity: LessonImportantNoteSeverity;
}

export class AdminLessonImageBlockDto extends AdminLessonContentBlockDto {
  @ApiProperty({
    enum: LessonContentBlockType,
    default: LessonContentBlockType.IMAGE,
    example: LessonContentBlockType.IMAGE,
  })
  type: LessonContentBlockType.IMAGE = LessonContentBlockType.IMAGE;

  @ApiProperty({ example: 'https://cdn.example.com/lesson-1.png' })
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_protocol: true })
  @MaxLength(LESSON_CONTENT_BLOCK_MAX_IMAGE_URL_LENGTH)
  url: string;

  @ApiProperty({ example: 'জ্যামিতিক চিত্র' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  altText: string;

  @ApiPropertyOptional({ example: 'ত্রিভুজের ক্ষেত্রফল' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  caption?: string;
}

@ValidatorConstraint({ name: 'lessonTableRows', async: false })
class LessonTableRowsConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const block = args.object as AdminLessonTableBlockDto;
    if (!Array.isArray(value) || !Array.isArray(block.headers)) {
      return false;
    }

    if (
      block.headers.length === 0 ||
      block.headers.length > LESSON_CONTENT_BLOCK_MAX_TABLE_COLUMNS
    ) {
      return false;
    }

    if (value.length > LESSON_CONTENT_BLOCK_MAX_TABLE_ROWS) {
      return false;
    }

    return value.every(
      (row) =>
        Array.isArray(row) &&
        row.length === block.headers.length &&
        row.length <= LESSON_CONTENT_BLOCK_MAX_TABLE_COLUMNS &&
        row.every(
          (cell) => typeof cell === 'string' && cell.trim().length > 0 && cell.length <= 1000,
        ),
    );
  }

  defaultMessage(): string {
    return 'Table rows must match the header width and stay within the allowed size limits';
  }
}

export class AdminLessonTableBlockDto extends AdminLessonContentBlockDto {
  @ApiProperty({
    enum: LessonContentBlockType,
    default: LessonContentBlockType.TABLE,
    example: LessonContentBlockType.TABLE,
  })
  type: LessonContentBlockType.TABLE = LessonContentBlockType.TABLE;

  @ApiProperty({ type: [String], example: ['রাশি', 'মান'] })
  @IsArray()
  @ArrayMaxSize(LESSON_CONTENT_BLOCK_MAX_TABLE_COLUMNS)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  headers: string[];

  @ApiProperty({
    type: [[String]],
    example: [
      ['a', '2'],
      ['b', '3'],
    ],
  })
  @IsArray()
  @Validate(LessonTableRowsConstraint)
  rows: string[][];
}

export class AdminLessonCitationBlockDto extends AdminLessonContentBlockDto {
  @ApiProperty({
    enum: LessonContentBlockType,
    default: LessonContentBlockType.CITATION,
    example: LessonContentBlockType.CITATION,
  })
  type: LessonContentBlockType.CITATION = LessonContentBlockType.CITATION;

  @ApiProperty({ example: 'NCTB Mathematics Class 8' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  bookName: string;

  @ApiPropertyOptional({ example: 'Chapter 4' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  chapter?: string;

  @ApiPropertyOptional({ example: 'Page 54' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  page?: string;

  @ApiPropertyOptional({ example: '...' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  excerpt?: string;
}

export class AdminLessonListBlockDto extends AdminLessonContentBlockDto {
  @ApiProperty({
    enum: LessonContentBlockType,
    default: LessonContentBlockType.LIST,
    example: LessonContentBlockType.LIST,
  })
  type: LessonContentBlockType.LIST = LessonContentBlockType.LIST;

  @ApiProperty({ type: [String], example: ['এক', 'দুই', 'তিন'] })
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(LESSON_CONTENT_BLOCK_MAX_TEXT_LENGTH, { each: true })
  items: string[];

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  ordered?: boolean;
}

export class AdminLessonQuoteBlockDto extends AdminLessonContentBlockDto {
  @ApiProperty({
    enum: LessonContentBlockType,
    default: LessonContentBlockType.QUOTE,
    example: LessonContentBlockType.QUOTE,
  })
  type: LessonContentBlockType.QUOTE = LessonContentBlockType.QUOTE;

  @ApiProperty({ example: 'শিক্ষা মানুষের মুক্তির পথ।' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(LESSON_CONTENT_BLOCK_MAX_TEXT_LENGTH)
  text: string;

  @ApiPropertyOptional({ example: 'জাতীয় পাঠ্যপুস্তক' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  attribution?: string;
}

export class AdminCreateLessonDto {
  @ApiProperty({ example: '64b8268b6cb348e3b53f8001', description: 'Chapter ObjectId' })
  @IsString()
  @IsNotEmpty()
  chapterId: string;

  @ApiProperty({ example: 'বর্গ নির্ণয়ের সূত্রাবলি' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'square-formulas' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: '(a+b)^2 ও (a-b)^2 সূত্রের প্রয়োগ' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ example: 'NCTB Class 8 Math Chapter 4 Page 54-58' })
  @IsOptional()
  @IsString()
  textbookReference?: string;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ example: 54 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageStart?: number;

  @ApiPropertyOptional({ example: 58 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageEnd?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  contentVersion?: number;

  @ApiPropertyOptional({
    type: () => [AdminLessonContentBlockDto],
    default: [],
    description: 'Structured lesson content blocks',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(LESSON_CONTENT_BLOCK_MAX_COUNT)
  @ValidateNested({ each: true })
  @Type(() => AdminLessonContentBlockDto, {
    discriminator: {
      property: 'type',
      subTypes: [
        { name: LessonContentBlockType.HEADING, value: AdminLessonHeadingBlockDto },
        { name: LessonContentBlockType.PARAGRAPH, value: AdminLessonParagraphBlockDto },
        { name: LessonContentBlockType.FORMULA, value: AdminLessonFormulaBlockDto },
        { name: LessonContentBlockType.EXAMPLE, value: AdminLessonExampleBlockDto },
        {
          name: LessonContentBlockType.IMPORTANT_NOTE,
          value: AdminLessonImportantNoteBlockDto,
        },
        { name: LessonContentBlockType.IMAGE, value: AdminLessonImageBlockDto },
        { name: LessonContentBlockType.TABLE, value: AdminLessonTableBlockDto },
        { name: LessonContentBlockType.CITATION, value: AdminLessonCitationBlockDto },
        { name: LessonContentBlockType.LIST, value: AdminLessonListBlockDto },
        { name: LessonContentBlockType.QUOTE, value: AdminLessonQuoteBlockDto },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  contentBlocks?: AdminLessonContentBlockDto[];
}

export class AdminUpdateLessonDto extends PartialType(AdminCreateLessonDto) {}
