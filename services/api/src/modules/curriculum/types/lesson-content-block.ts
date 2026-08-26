export enum LessonContentBlockType {
  HEADING = 'heading',
  PARAGRAPH = 'paragraph',
  FORMULA = 'formula',
  EXAMPLE = 'example',
  IMPORTANT_NOTE = 'important_note',
  IMAGE = 'image',
  TABLE = 'table',
  CITATION = 'citation',
  LIST = 'list',
  QUOTE = 'quote',
}

export enum LessonImportantNoteSeverity {
  INFO = 'info',
  WARNING = 'warning',
  TIP = 'tip',
}

export interface LessonContentBlockBase {
  id: string;
  type: LessonContentBlockType;
  order: number;
}

export interface LessonHeadingContentBlock extends LessonContentBlockBase {
  type: LessonContentBlockType.HEADING;
  text: string;
  level: 1 | 2 | 3;
}

export interface LessonParagraphContentBlock extends LessonContentBlockBase {
  type: LessonContentBlockType.PARAGRAPH;
  text: string;
}

export interface LessonFormulaContentBlock extends LessonContentBlockBase {
  type: LessonContentBlockType.FORMULA;
  expression: string;
  description?: string;
}

export interface LessonExampleContentBlock extends LessonContentBlockBase {
  type: LessonContentBlockType.EXAMPLE;
  title?: string;
  body: string;
  solution?: string;
}

export interface LessonImportantNoteContentBlock extends LessonContentBlockBase {
  type: LessonContentBlockType.IMPORTANT_NOTE;
  title?: string;
  text: string;
  severity: LessonImportantNoteSeverity;
}

export interface LessonImageContentBlock extends LessonContentBlockBase {
  type: LessonContentBlockType.IMAGE;
  url: string;
  altText: string;
  caption?: string;
}

export interface LessonTableContentBlock extends LessonContentBlockBase {
  type: LessonContentBlockType.TABLE;
  headers: string[];
  rows: string[][];
}

export interface LessonCitationContentBlock extends LessonContentBlockBase {
  type: LessonContentBlockType.CITATION;
  bookName: string;
  chapter?: string;
  page?: string;
  excerpt?: string;
}

export interface LessonListContentBlock extends LessonContentBlockBase {
  type: LessonContentBlockType.LIST;
  items: string[];
  ordered?: boolean;
}

export interface LessonQuoteContentBlock extends LessonContentBlockBase {
  type: LessonContentBlockType.QUOTE;
  text: string;
  attribution?: string;
}

export type LessonContentBlock =
  | LessonHeadingContentBlock
  | LessonParagraphContentBlock
  | LessonFormulaContentBlock
  | LessonExampleContentBlock
  | LessonImportantNoteContentBlock
  | LessonImageContentBlock
  | LessonTableContentBlock
  | LessonCitationContentBlock
  | LessonListContentBlock
  | LessonQuoteContentBlock;

export const LESSON_CONTENT_BLOCK_MAX_COUNT = 200;
export const LESSON_CONTENT_BLOCK_MAX_TABLE_ROWS = 100;
export const LESSON_CONTENT_BLOCK_MAX_TABLE_COLUMNS = 20;
export const LESSON_CONTENT_BLOCK_MAX_TEXT_LENGTH = 10000;
export const LESSON_CONTENT_BLOCK_MAX_SHORT_TEXT_LENGTH = 2000;
export const LESSON_CONTENT_BLOCK_MAX_IMAGE_URL_LENGTH = 2048;

function compareBlocks(
  a: LessonContentBlock,
  b: LessonContentBlock,
  indexA: number,
  indexB: number,
): number {
  const orderDiff = (a.order ?? 0) - (b.order ?? 0);
  if (orderDiff !== 0) {
    return orderDiff;
  }

  const idDiff = (a.id ?? '').localeCompare(b.id ?? '');
  if (idDiff !== 0) {
    return idDiff;
  }

  return indexA - indexB;
}

export function sortLessonContentBlocks(
  blocks: LessonContentBlock[] | undefined | null,
): LessonContentBlock[] {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return [];
  }

  return [...blocks]
    .map((block, index) => ({ block, index }))
    .sort((left, right) => compareBlocks(left.block, right.block, left.index, right.index))
    .map(({ block }) => block);
}

function isNonEmptyString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
}

function isStringArray(value: unknown, maxLength: number, maxCount: number): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= maxCount &&
    value.every((item) => isNonEmptyString(item, maxLength))
  );
}

function isStringMatrix(
  value: unknown,
  maxLength: number,
  maxRows: number,
  maxColumns: number,
): value is string[][] {
  return (
    Array.isArray(value) &&
    value.length <= maxRows &&
    value.every(
      (row) =>
        Array.isArray(row) &&
        row.length <= maxColumns &&
        row.every((cell) => isNonEmptyString(cell, maxLength)),
    )
  );
}

export function validateLessonContentBlock(value: unknown): value is LessonContentBlock {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const block = value as Record<string, unknown>;
  if (
    !isNonEmptyString(block.id, 120) ||
    typeof block.order !== 'number' ||
    !Number.isFinite(block.order) ||
    block.order < 0 ||
    !isNonEmptyString(block.type, 32)
  ) {
    return false;
  }

  switch (block.type) {
    case LessonContentBlockType.HEADING:
      return (
        isNonEmptyString(block.text, LESSON_CONTENT_BLOCK_MAX_SHORT_TEXT_LENGTH) &&
        [1, 2, 3].includes(Number(block.level))
      );
    case LessonContentBlockType.PARAGRAPH:
      return isNonEmptyString(block.text, LESSON_CONTENT_BLOCK_MAX_TEXT_LENGTH);
    case LessonContentBlockType.FORMULA:
      return isNonEmptyString(block.expression, LESSON_CONTENT_BLOCK_MAX_SHORT_TEXT_LENGTH);
    case LessonContentBlockType.EXAMPLE:
      return (
        isNonEmptyString(block.body, LESSON_CONTENT_BLOCK_MAX_TEXT_LENGTH) &&
        (block.title == null ||
          isNonEmptyString(block.title, LESSON_CONTENT_BLOCK_MAX_SHORT_TEXT_LENGTH)) &&
        (block.solution == null ||
          isNonEmptyString(block.solution, LESSON_CONTENT_BLOCK_MAX_TEXT_LENGTH))
      );
    case LessonContentBlockType.IMPORTANT_NOTE:
      return (
        isNonEmptyString(block.text, LESSON_CONTENT_BLOCK_MAX_TEXT_LENGTH) &&
        Object.values(LessonImportantNoteSeverity).includes(
          block.severity as LessonImportantNoteSeverity,
        )
      );
    case LessonContentBlockType.IMAGE:
      return (
        isNonEmptyString(block.url, LESSON_CONTENT_BLOCK_MAX_IMAGE_URL_LENGTH) &&
        isNonEmptyString(block.altText, LESSON_CONTENT_BLOCK_MAX_SHORT_TEXT_LENGTH)
      );
    case LessonContentBlockType.TABLE:
      return (
        isStringArray(block.headers, 100, LESSON_CONTENT_BLOCK_MAX_TABLE_COLUMNS) &&
        isStringMatrix(
          block.rows,
          1000,
          LESSON_CONTENT_BLOCK_MAX_TABLE_ROWS,
          LESSON_CONTENT_BLOCK_MAX_TABLE_COLUMNS,
        ) &&
        block.rows.every((row) => row.length === (block.headers as string[]).length)
      );
    case LessonContentBlockType.CITATION:
      return isNonEmptyString(block.bookName, LESSON_CONTENT_BLOCK_MAX_SHORT_TEXT_LENGTH);
    case LessonContentBlockType.LIST:
      return isStringArray(block.items, LESSON_CONTENT_BLOCK_MAX_TEXT_LENGTH, 50);
    case LessonContentBlockType.QUOTE:
      return isNonEmptyString(block.text, LESSON_CONTENT_BLOCK_MAX_TEXT_LENGTH);
    default:
      return false;
  }
}

export function validateLessonContentBlocks(blocks: unknown): blocks is LessonContentBlock[] {
  return (
    Array.isArray(blocks) &&
    blocks.length <= LESSON_CONTENT_BLOCK_MAX_COUNT &&
    blocks.every((block) => validateLessonContentBlock(block))
  );
}

export function normalizeLessonContentBlocks(
  blocks: LessonContentBlock[] | undefined | null,
): LessonContentBlock[] {
  return sortLessonContentBlocks(blocks ?? []).map((block) => ({ ...block }));
}
