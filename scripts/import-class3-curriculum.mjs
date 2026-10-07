import { createRequire } from 'node:module';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, basename, dirname, relative, isAbsolute, sep } from 'node:path';

const require = createRequire(new URL('../services/api/package.json', import.meta.url));
const mongoose = require('mongoose');
const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const applyChanges = process.argv.includes('--apply');
const linkSplitPdfsOnly = process.argv.includes('--link-split-pdfs-only');
const books = [
  {
    subjectSlug: 'bangla',
    groupMode: 'single-reading-list',
    managedPrefix: 'bn3-',
  },
  {
    subjectSlug: 'english-for-today',
    groupMode: 'units',
    managedPrefix: 'en3-',
  },
  {
    subjectSlug: 'primary-mathematics',
    groupMode: 'units',
    managedPrefix: 'math3-',
  },
  {
    subjectSlug: 'primary-science',
    groupMode: 'chapters-lessons',
    managedPrefix: 'science3-',
  },
  {
    subjectSlug: 'bangladesh-and-global-studies',
    groupMode: 'chapters-lessons',
    managedPrefix: 'bgs3-',
  },
  {
    subjectSlug: 'islamic-studies',
    groupMode: 'chapters-lessons',
    managedPrefix: 'islam3-',
  },
  {
    subjectSlug: 'hindu-religion-studies',
    groupMode: 'chapters-lessons',
    managedPrefix: 'hindu3-',
  },
  {
    subjectSlug: 'buddhist-religion-studies',
    groupMode: 'chapters-lessons',
    managedPrefix: 'buddhist3-',
  },
  {
    subjectSlug: 'christian-religion-studies',
    groupMode: 'chapters-lessons',
    managedPrefix: 'christian3-',
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
  const catalog = JSON.parse(
    await readFile(resolve(repoRoot, 'books/catalog.json'), 'utf8'),
  );
  const catalogBook = catalog.books.find(
    (entry) => entry.classLevel === 3 && entry.subjectSlug === config.subjectSlug,
  );
  if (!catalogBook?.curriculumMap || !['draft', 'published'].includes(catalogBook.curriculumState)) {
    throw new Error(`No Class 3 textbook catalog entry for ${config.subjectSlug}`);
  }
  const curriculumPath = resolve(repoRoot, catalogBook.curriculumMap);
  if (!curriculumPath.startsWith(`${repoRoot}${repoRoot.endsWith('/') ? '' : '/'}`)) {
    throw new Error(`Curriculum map escapes repository root: ${catalogBook.curriculumMap}`);
  }
  const directory = dirname(curriculumPath);
  const curriculum = JSON.parse(
    await readFile(curriculumPath, 'utf8'),
  );
  const grade = curriculum.book?.grade;
  const totalPdfPages = curriculum.book?.total_pdf_pages;
  if (grade !== catalogBook.classLevel || !Number.isInteger(totalPdfPages)) {
    throw new Error(`${catalogBook.curriculumMap} has invalid grade/page metadata`);
  }
  await stat(resolve(repoRoot, catalogBook.sourceFile));

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
  } else if (config.groupMode === 'chapters-lessons') {
    groups = curriculum.chapters.map((chapter) => ({
      id: chapter.id,
      order: chapter.order,
      slug: chapter.id,
      title: chapter.textbook_title_bn ?? chapter.title_bn,
      summary: null,
    }));
    const groupIds = new Set(groups.map((group) => group.id));
    lessons = curriculum.lessons.map((lesson) => {
      if (!groupIds.has(lesson.chapter_id)) {
        throw new Error(`Unknown chapter reference in ${lesson.id}`);
      }
      const printedPages = lesson.source?.printed_pages;
      const pdfPages = lesson.source?.pdf_pages_1_based;
      return {
        id: lesson.id,
        groupId: lesson.chapter_id,
        order: lesson.order_in_chapter ?? lesson.global_order,
        title: lesson.title_bn ?? lesson.textbook_title,
        summary: lesson.objective_bn ?? lesson.objective,
        publicationStatus: lesson.publication_status,
        printedPages: pageRange(printedPages, `${lesson.id}.printed`, 9999),
        pdfPages: pageRange(pdfPages, `${lesson.id}.pdf`, totalPdfPages),
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
    throw new Error(`${catalogBook.curriculumMap} has no importable groups/lessons`);
  }
  if (
    catalogBook.curriculumState === 'draft' &&
    lessons.some((lesson) => !lesson.publicationStatus?.toLowerCase().includes('draft'))
  ) {
    throw new Error(`${catalogBook.curriculumMap} contains lesson(s) not marked as draft`);
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
    const splitPdfFile = resolve(directory, relativePath);
    const classBooksRoot = resolve(repoRoot, 'books/class-3');
    if (splitPdfFile !== classBooksRoot && !splitPdfFile.startsWith(`${classBooksRoot}${sep}`)) {
      throw new Error(`Split PDF escapes Class 3 book directory: ${relativePath}`);
    }
    await stat(splitPdfFile);
  }

  const splitPdfByLessonId = new Map(
    [...(curriculum.units ?? []), ...(curriculum.lessons ?? [])]
      .filter((entry) => entry.source?.split_pdf)
      .map((entry) => {
        const absolutePath = resolve(directory, entry.source.split_pdf);
        const storagePath = relative(resolve(repoRoot, 'books'), absolutePath);
        if (isAbsolute(storagePath) || storagePath === '..' || storagePath.startsWith(`..${sep}`)) {
          throw new Error(`Invalid split PDF path for ${entry.id}`);
        }
        return [entry.id, storagePath];
      }),
  );
  lessons = lessons.map((lesson) => ({
    ...lesson,
    lessonPdfPath: splitPdfByLessonId.get(lesson.id) ?? null,
  }));

  return {
    ...config,
    sourcePdf: catalogBook.sourceFile,
    curriculum,
    groups,
    lessons,
    grade,
    totalPdfPages,
    publicationMode: catalogBook.curriculumState,
  };
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
  if (linkSplitPdfsOnly) {
    const plans = [];
    let missingLessons = 0;
    for (const book of loadedBooks) {
      const subject = await db.collection('subjects').findOne({
        classLevel: book.grade,
        medium: 'bangla',
        slug: book.subjectSlug,
      });
      if (!subject) throw new Error(`No class-${book.grade} subject found for slug ${book.subjectSlug}`);

      const chapters = await db.collection('chapters').find({ subjectId: subject._id }).toArray();
      const chapterBySlug = new Map(chapters.map((chapter) => [chapter.slug, chapter._id]));
      const operations = [];
      for (const lesson of book.lessons) {
        const chapterId = chapterBySlug.get(lesson.groupId);
        if (!chapterId) {
          throw new Error(`No existing chapter ${lesson.groupId} for ${book.subjectSlug}`);
        }
        const exists = await db.collection('lessons').findOne({ chapterId, slug: lesson.id }, { projection: { _id: 1 } });
        if (!exists) {
          missingLessons++;
          continue;
        }
        operations.push({
          updateOne: {
            filter: { _id: exists._id },
            update: { $set: { lessonPdfPath: lesson.lessonPdfPath } },
          },
        });
      }
      plans.push({ subjectName: subject.name, operations });
    }

    if (applyChanges) {
      for (const plan of plans) {
        if (plan.operations.length > 0) {
          await db.collection('lessons').bulkWrite(plan.operations, { ordered: true });
        }
      }
    }
    const linkedCount = plans.reduce((sum, plan) => sum + plan.operations.length, 0);
    console.log(`${applyChanges ? 'UPDATED' : 'DRY RUN'} split-PDF links for ${linkedCount} existing lessons; ${missingLessons} lesson records were not found.`);
    if (!applyChanges) console.log('No database records were changed. Re-run with --apply --link-split-pdfs-only to update only lessonPdfPath.');
    await mongoose.disconnect();
    return;
  }

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
      `- ${subject.name}: ${book.groups.length} groups, ${book.lessons.length} lessons, ${book.totalPdfPages} PDF pages${book.publicationMode === 'draft' ? ' (draft; admin review required)' : ''}`,
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
          { chapterId: group._id, workflowStatus: { $ne: 'ARCHIVED' } },
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
      const existingGroup = await db.collection('chapters').findOne(filter);
      const values = {
        subjectId: subject._id,
        title: group.title,
        slug: group.slug,
        order: group.order,
        isPublished:
          book.publicationMode === 'published' || existingGroup?.isPublished === true,
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
      const existingLesson = await db.collection('lessons').findOne(filter);
      const existingWorkflowStatus = existingLesson?.workflowStatus;
      const preserveReviewedStatus =
        book.publicationMode === 'draft' &&
        ['APPROVED', 'PUBLISHED'].includes(existingWorkflowStatus);
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
        lessonPdfPath: lesson.lessonPdfPath,
        isPublished:
          book.publicationMode === 'published' ||
          (preserveReviewedStatus && existingLesson?.isPublished === true),
        workflowStatus:
          book.publicationMode === 'published'
            ? 'PUBLISHED'
            : preserveReviewedStatus
              ? existingWorkflowStatus
              : 'DRAFT',
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
            workflowStatus: { $ne: 'ARCHIVED' },
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
