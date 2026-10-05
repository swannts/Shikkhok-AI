import { createRequire } from 'node:module';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, basename } from 'node:path';

const require = createRequire(new URL('../services/api/package.json', import.meta.url));
const mongoose = require('mongoose');
const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const applyChanges = process.argv.includes('--apply');
const books = [
  {
    directory: 'books/class-3/bangla-class3',
    curriculumFile: 'bangla-class3-curriculum.json',
    subjectSlug: 'bangla',
    sourcePdf: 'data/curriculum-uploads/amar-bangla-boi.pdf',
    groupMode: 'single-reading-list',
    managedPrefix: 'bn3-',
  },
  {
    directory: 'books/class-3/english-class3',
    curriculumFile: 'english-class3-curriculum.json',
    subjectSlug: 'english-for-today',
    sourcePdf: 'data/curriculum-uploads/class-3-english-for-today.pdf',
    groupMode: 'units',
    managedPrefix: 'en3-',
  },
  {
    directory: 'books/class-3/math-class3',
    curriculumFile: 'math-class3-curriculum.json',
    subjectSlug: 'primary-mathematics',
    sourcePdf: 'data/curriculum-uploads/class-3-primary-math.pdf',
    groupMode: 'units',
    managedPrefix: 'math3-',
  },
];

function pageRange(value, field, totalPages) {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    !Number.isInteger(value[0]) ||
    !Number.isInteger(value[1]) ||
    value[0] < 1 ||
    value[1] < value[0] ||
    value[1] > totalPages
  ) {
    throw new Error(`Invalid ${field} page range: ${JSON.stringify(value)}`);
  }
  return value;
}

function makeObjectiveBlocks(id, heading, objective, focusWords = []) {
  const blocks = [
    {
      id: `${id}-objective-title`,
      type: 'heading',
      order: 1,
      text: heading,
      level: 2,
    },
    {
      id: `${id}-objective`,
      type: 'paragraph',
      order: 2,
      text: objective,
    },
  ];
  if (focusWords.length > 0) {
    blocks.push({
      id: `${id}-focus-words-title`,
      type: 'heading',
      order: 3,
      text: 'নির্বাচিত কিছু শব্দ',
      level: 3,
    });
    blocks.push({
      id: `${id}-focus-words`,
      type: 'list',
      order: 4,
      items: focusWords,
    });
  }
  return blocks;
}

async function loadBook(config) {
  const directory = resolve(repoRoot, config.directory);
  const curriculum = JSON.parse(
    await readFile(resolve(directory, config.curriculumFile), 'utf8'),
  );
  const grade = curriculum.book?.grade;
  const totalPdfPages = curriculum.book?.total_pdf_pages;
  if (grade !== 3 || !Number.isInteger(totalPdfPages)) {
    throw new Error(`${config.curriculumFile} has invalid grade/page metadata`);
  }
  await stat(resolve(repoRoot, config.sourcePdf));

  let groups;
  let lessons;
  if (config.groupMode === 'single-reading-list') {
    groups = [
      {
        id: 'bn3-reading-list',
        order: 1,
        slug: 'bn3-reading-list',
        title: 'বাংলা বইয়ের পাঠ',
        summary: 'বইয়ের ২৯টি পাঠ। প্রতিটি পাঠের মূল পৃষ্ঠা মূল PDF-এ খোলা যাবে।',
      },
    ];
    lessons = curriculum.units.map((unit) => {
      const printed = pageRange(unit.source?.printed_pages, `${unit.id}.printed`, 9999);
      const pdf = pageRange(
        unit.source?.pdf_pages_1_based,
        `${unit.id}.pdf`,
        totalPdfPages,
      );
      return {
        id: unit.id,
        groupId: 'bn3-reading-list',
        order: unit.order,
        title: unit.title_bn,
        summary: unit.learning_objective_bn,
        printedPages: printed,
        pdfPages: pdf,
      };
    });
  } else if (config.subjectSlug === 'english-for-today') {
    groups = curriculum.units.map((unit) => ({
      id: unit.id,
      order: unit.order,
      slug: unit.id,
      title: unit.title,
      summary: null,
    }));
    const unitIds = new Set(groups.map((group) => group.id));
    lessons = curriculum.lessons.map((lesson) => {
      if (!unitIds.has(lesson.unit_id)) {
        throw new Error(`Unknown English unit reference in ${lesson.id}`);
      }
      return {
        id: lesson.id,
        groupId: lesson.unit_id,
        order: lesson.lesson_number_in_unit,
        title: lesson.textbook_title,
        summary: lesson.objective,
        printedPages: pageRange(
          lesson.source?.printed_pages,
          `${lesson.id}.printed`,
          9999,
        ),
        pdfPages: pageRange(
          lesson.source?.pdf_pages_1_based,
          `${lesson.id}.pdf`,
          totalPdfPages,
        ),
        focusWords: lesson.focus_vocabulary?.words ?? [],
      };
    });
  } else {
    groups = curriculum.chapters.map((chapter) => ({
      id: chapter.id,
      order: chapter.order,
      slug: chapter.id,
      title: chapter.textbook_title_bn,
      summary: null,
    }));
    const groupIds = new Set(groups.map((group) => group.id));
    lessons = curriculum.lessons.map((lesson) => {
      if (!groupIds.has(lesson.chapter_id)) {
        throw new Error(`Unknown Math chapter reference in ${lesson.id}`);
      }
      return {
        id: lesson.id,
        groupId: lesson.chapter_id,
        order: lesson.order_in_chapter,
        title: lesson.title_bn,
        summary: lesson.objective_bn,
        printedPages: pageRange(
          lesson.source?.printed_pages,
          `${lesson.id}.printed`,
          9999,
        ),
        pdfPages: pageRange(
          lesson.source?.pdf_pages_1_based,
          `${lesson.id}.pdf`,
          totalPdfPages,
        ),
      };
    });
  }

  if (!Array.isArray(groups) || groups.length === 0 || lessons.length === 0) {
    throw new Error(`${config.curriculumFile} has no importable groups/lessons`);
  }
  const splitPdfs = [
    ...new Set(
      [...(curriculum.units ?? []), ...(curriculum.lessons ?? [])].flatMap((entry) => {
        const relativePath = entry.source?.split_pdf;
        return relativePath ? [relativePath] : [];
      }),
    ),
  ];
  for (const relativePath of splitPdfs) {
    await stat(resolve(directory, relativePath));
  }

  return { ...config, curriculum, groups, lessons, grade, totalPdfPages };
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('Set MONGODB_URI; the importer does not use a default database credential.');
  }
  const loadedBooks = await Promise.all(books.map(loadBook));
  console.log(`${applyChanges ? 'APPLY' : 'DRY RUN'}: validated ${loadedBooks.length} class-3 books`);

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  let totalArchivedChapters = 0;
  let totalArchivedLessons = 0;

  for (const book of loadedBooks) {
    const subject = await db.collection('subjects').findOne({
      classLevel: book.grade,
      medium: 'bangla',
      slug: book.subjectSlug,
    });
    if (!subject) throw new Error(`No class-${book.grade} subject found for slug ${book.subjectSlug}`);
    const year = subject.curriculumYear;
    if (!Number.isInteger(year)) {
      throw new Error(`Subject ${subject.name} has no configured curriculum year`);
    }
    const textbook = await db.collection('textbooks').findOne({
      subjectId: subject._id,
      classLevel: book.grade,
      medium: 'bangla',
      curriculumYear: year,
      isPublished: true,
    });
    if (!textbook?.pdfStoragePath) {
      throw new Error(`No published source PDF registered for ${subject.name}`);
    }
    if (basename(textbook.pdfStoragePath) !== basename(book.sourcePdf)) {
      throw new Error(
        `Source PDF mismatch for ${subject.name}: DB has ${textbook.pdfStoragePath}, expected ${basename(book.sourcePdf)}`,
      );
    }

    console.log(
      `- ${subject.name}: ${book.groups.length} navigation groups, ${book.lessons.length} lessons, ${book.totalPdfPages} source PDF pages`,
    );
    const desiredGroupSlugs = new Set(book.groups.map((group) => group.slug));
    const desiredLessonSlugs = new Set(book.lessons.map((lesson) => lesson.id));
    const prefixPattern = new RegExp(`^${book.managedPrefix}`);

    const existingGroups = await db
      .collection('chapters')
      .find({ subjectId: subject._id })
      .toArray();
    const obsoleteGroups = existingGroups.filter((group) => {
      const legacyOcrGroup = group.slug === 'pathsomuh' || group.title === 'পাঠসমূহ';
      const priorCuratedGroup = prefixPattern.test(group.slug ?? '');
      return (
        (legacyOcrGroup || priorCuratedGroup) &&
        !desiredGroupSlugs.has(group.slug)
      );
    });
    totalArchivedChapters += obsoleteGroups.filter((group) => group.isPublished !== false).length;
    for (const group of obsoleteGroups) {
      if (applyChanges) {
        const archived = await db.collection('lessons').updateMany(
          { chapterId: group._id, isPublished: { $ne: false } },
          { $set: { isPublished: false, workflowStatus: 'ARCHIVED' } },
        );
        totalArchivedLessons += archived.modifiedCount;
        await db.collection('chapters').updateOne(
          { _id: group._id },
          { $set: { isPublished: false } },
        );
      }
    }

    const groupIds = new Map();
    for (const group of book.groups) {
      const filter = { subjectId: subject._id, slug: group.slug };
      const values = {
        subjectId: subject._id,
        title: group.title,
        slug: group.slug,
        order: group.order,
        isPublished: true,
        ...(group.summary ? { summary: group.summary } : {}),
      };
      if (applyChanges) {
        await db.collection('chapters').updateOne(filter, { $set: values }, { upsert: true });
      }
      const savedGroup = await db.collection('chapters').findOne(filter);
      if (savedGroup) groupIds.set(group.id, savedGroup._id);
    }

    for (const lesson of book.lessons) {
      if (typeof lesson.summary !== 'string' || lesson.summary.trim().length === 0) {
        throw new Error(`Missing learning objective for ${lesson.id}`);
      }
      const chapterId = groupIds.get(lesson.groupId);
      if (!chapterId && applyChanges) {
        throw new Error(`Could not persist navigation group for ${lesson.id}`);
      }
      const printedStart = lesson.printedPages[0];
      const printedEnd = lesson.printedPages[1];
      const pdfStart = lesson.pdfPages[0];
      const pdfEnd = lesson.pdfPages[1];
      const reference = printedStart === printedEnd
        ? `মুদ্রিত পৃষ্ঠা ${printedStart}`
        : `মুদ্রিত পৃষ্ঠা ${printedStart}–${printedEnd}`;
      const filter = { chapterId, slug: lesson.id };
      const values = {
        chapterId,
        title: lesson.title,
        slug: lesson.id,
        summary: lesson.summary,
        textbookReference: reference,
        order: lesson.order,
        pageStart: printedStart,
        pageEnd: printedEnd,
        sourcePdfPageStart: pdfStart,
        sourcePdfPageEnd: pdfEnd,
        isPublished: true,
        workflowStatus: 'PUBLISHED',
        contentVersion: 1,
        contentBlocks: makeObjectiveBlocks(
          lesson.id,
          'শেখার লক্ষ্য',
          lesson.summary,
          lesson.focusWords,
        ),
      };
      if (applyChanges) {
        await db.collection('lessons').updateOne(filter, { $set: values }, { upsert: true });
      }
    }

    for (const group of book.groups) {
      const chapterId = groupIds.get(group.id);
      if (!chapterId || !applyChanges) continue;
      const obsoleteLessons = await db.collection('lessons').updateMany(
        {
          chapterId,
          slug: { $regex: prefixPattern, $nin: [...desiredLessonSlugs] },
          isPublished: { $ne: false },
        },
        { $set: { isPublished: false, workflowStatus: 'ARCHIVED' } },
      );
      totalArchivedLessons += obsoleteLessons.modifiedCount;
    }

    if (applyChanges) {
      await db.collection('textbooks').updateOne(
        { _id: textbook._id },
        {
          $set: {
            totalChapters: book.groups.length,
            totalLessons: book.lessons.length,
          },
        },
      );
    }
  }

  if (!applyChanges) {
    console.log('No database records were changed. Re-run with --apply to import.');
  } else {
    console.log(
      `Imported ${loadedBooks.reduce((count, book) => count + book.groups.length, 0)} groups and ${loadedBooks.reduce((count, book) => count + book.lessons.length, 0)} lessons. Archived ${totalArchivedChapters} old chapters and ${totalArchivedLessons} old lessons (records retained).`,
    );
  }
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
