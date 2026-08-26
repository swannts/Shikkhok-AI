import {
  LessonContentBlockType,
  LessonImportantNoteSeverity,
  sortLessonContentBlocks,
  validateLessonContentBlocks,
} from '../types/lesson-content-block';

describe('lesson content block helpers', () => {
  it('sorts blocks by order, then id, then original position', () => {
    const blocks = sortLessonContentBlocks([
      {
        id: 'b2',
        type: LessonContentBlockType.PARAGRAPH,
        order: 2,
        text: 'second',
      },
      {
        id: 'b1',
        type: LessonContentBlockType.HEADING,
        order: 1,
        level: 2,
        text: 'first',
      },
      {
        id: 'b3',
        type: LessonContentBlockType.PARAGRAPH,
        order: 2,
        text: 'third',
      },
    ]);

    expect(blocks.map((block) => block.id)).toEqual(['b1', 'b2', 'b3']);
  });

  it('validates supported block types and rejects malformed tables', () => {
    expect(
      validateLessonContentBlocks([
        {
          id: 'note-1',
          type: LessonContentBlockType.IMPORTANT_NOTE,
          order: 1,
          text: 'মনে রাখবে',
          severity: LessonImportantNoteSeverity.TIP,
        },
      ]),
    ).toBe(true);

    expect(
      validateLessonContentBlocks([
        {
          id: 'table-1',
          type: LessonContentBlockType.TABLE,
          order: 2,
          headers: ['রাশি', 'মান'],
          rows: [['a', '2', 'extra']],
        },
      ]),
    ).toBe(false);
  });
});
