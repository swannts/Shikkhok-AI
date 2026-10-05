import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { basename, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../services/api/package.json', import.meta.url));
const mongoose = require('mongoose');
const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const catalogPath = resolve(repoRoot, 'books/catalog.json');
const applyChanges = process.argv.includes('--apply');
const defaultApiUploadRoot = '/app/uploads/curriculum';

async function sha256(filePath) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest('hex');
}

async function loadCatalog() {
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  if (
    catalog.schemaVersion !== 1 ||
    !Number.isInteger(catalog.curriculumYear) ||
    typeof catalog.curriculumVersion !== 'string' ||
    !['bangla', 'english'].includes(catalog.medium) ||
    !Array.isArray(catalog.books) ||
    catalog.books.length === 0
  ) {
    throw new Error('books/catalog.json has invalid catalog metadata');
  }

  const keys = new Set();
  const entries = [];
  for (const book of catalog.books) {
    const key = `${book.classLevel}:${book.subjectSlug}`;
    if (
      !Number.isInteger(book.classLevel) ||
      book.classLevel < 1 ||
      book.classLevel > 12 ||
      typeof book.subjectSlug !== 'string' ||
      typeof book.subjectName !== 'string' ||
      typeof book.title !== 'string' ||
      typeof book.titleBn !== 'string' ||
      !Number.isInteger(book.subjectOrder) ||
      typeof book.sourceFile !== 'string' ||
      keys.has(key)
    ) {
      throw new Error(`Invalid or duplicate catalog entry: ${key}`);
    }
    keys.add(key);

    const sourcePath = resolve(repoRoot, book.sourceFile);
    const repositoryPrefix = repoRoot.endsWith(sep) ? repoRoot : `${repoRoot}${sep}`;
    if (!sourcePath.startsWith(repositoryPrefix)) {
      throw new Error(`Book source escapes repository root: ${book.sourceFile}`);
    }
    const metadata = await stat(sourcePath);
    if (!metadata.isFile() || metadata.size < 5) {
      throw new Error(`Book PDF is missing or empty: ${book.sourceFile}`);
    }
    const stream = createReadStream(sourcePath, { start: 0, end: 4 });
    let header = '';
    for await (const chunk of stream) header += chunk.toString('ascii');
    if (header !== '%PDF-') {
      throw new Error(`Book source is not a PDF: ${book.sourceFile}`);
    }

    entries.push({
      ...book,
      sourcePath,
      fileSizeBytes: metadata.size,
      checksumSha256: await sha256(sourcePath),
      pdfStoragePath: `${process.env.CURRICULUM_API_UPLOAD_DIR || defaultApiUploadRoot}/${basename(sourcePath)}`,
    });
  }
  return { catalog, entries };
}

async function seed() {
  const { catalog, entries } = await loadCatalog();
  console.log(
    `${applyChanges ? 'APPLY' : 'DRY RUN'}: validated ${entries.length} textbook PDFs for classes ${catalog.availableClasses.join(', ')}`,
  );
  for (const book of entries) {
    console.log(`- Class ${book.classLevel} / ${book.subjectName}: ${book.fileSizeBytes} bytes`);
  }
  if (!applyChanges) {
    console.log('No database records were changed. Re-run with --apply to seed.');
    return;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('Set MONGODB_URI before applying the catalog.');
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  const now = new Date();

  for (const book of entries) {
    const subjectFilter = {
      classLevel: book.classLevel,
      medium: catalog.medium,
      curriculumYear: catalog.curriculumYear,
      slug: book.subjectSlug,
    };
    await db.collection('subjects').updateOne(
      subjectFilter,
      {
        $set: {
          ...subjectFilter,
          name: book.subjectName,
          curriculumVersion: catalog.curriculumVersion,
          order: book.subjectOrder,
          isPublished: true,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
    const subject = await db.collection('subjects').findOne(subjectFilter);
    if (!subject) throw new Error(`Could not seed subject ${book.subjectSlug}`);

    const textbookFilter = {
      subjectId: subject._id,
      classLevel: book.classLevel,
      medium: catalog.medium,
      curriculumYear: catalog.curriculumYear,
    };
    await db.collection('textbooks').updateOne(
      textbookFilter,
      {
        $set: {
          ...textbookFilter,
          title: book.title,
          titleBn: book.titleBn,
          curriculumVersion: catalog.curriculumVersion,
          edition: `${catalog.curriculumYear} NCTB`,
          pdfStoragePath: book.pdfStoragePath,
          fileSizeBytes: book.fileSizeBytes,
          checksumSha256: book.checksumSha256,
          isPublished: true,
          updatedAt: now,
        },
        $setOnInsert: {
          totalChapters: 0,
          totalLessons: 0,
          indexingStatus: 'draft',
          indexedChunkCount: 0,
          failedChunkCount: 0,
          createdAt: now,
        },
      },
      { upsert: true },
    );
  }

  console.log(`Seeded ${entries.length} books and their class/subject records.`);
}

seed()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
