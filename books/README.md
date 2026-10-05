# Textbook catalog and curriculum packages

`catalog.json` is the checked-in source of truth for the textbook PDFs currently
in `data/curriculum-uploads`: Class 2 (3 books) and Class 3 (9 books). It seeds
their class, subject, medium, curriculum year/version, PDF path, size, and
checksum. It does not claim that books for other classes are present.

Class 3 directories contain chapter/unit maps, lesson plans, and PDF page
references for all nine catalogued subjects. They provide learning objectives
and page references, not full textbook transcripts; the original PDF remains
the reading source. The map packages carry different review states: Bangla,
English, and Mathematics retain their existing published status; Science,
Bangladesh and Global Studies, and the four religion subjects import as drafts
until an administrator reviews and publishes them.

Seed/reconcile subject and textbook records after starting MongoDB:

```sh
MONGODB_URI="<your MongoDB URI>" node scripts/seed-curriculum-books.mjs
MONGODB_URI="<your MongoDB URI>" node scripts/seed-curriculum-books.mjs --apply
```

The catalog seeder validates every source PDF and runs read-only by default.
Applying it is idempotent: it upserts subjects and textbooks while preserving
existing chapter/lesson counts and indexing state. `CURRICULUM_API_UPLOAD_DIR`
can override the API-visible PDF directory (defaults to `/app/uploads/curriculum`).

Import/reconcile Class 3 chapter/lesson maps separately:

```sh
MONGODB_URI="<your MongoDB URI>" node scripts/import-class3-curriculum.mjs
MONGODB_URI="<your MongoDB URI>" node scripts/import-class3-curriculum.mjs --apply
```

This importer validates referenced split PDFs and archives legacy OCR
placeholders instead of deleting them. Draft maps are not made visible to
students. It does not alter source PDFs, transcribe textbook text, or import
map-embedded practice questions. Class 2 PDFs are registered in the catalog,
but have no chapter/lesson map package yet.

For lesson page metadata, `pageStart`/`pageEnd` refer to printed textbook pages,
while `sourcePdfPageStart`/`sourcePdfPageEnd` refer to 1-based pages in the
original PDF. The mobile reader uses the latter to open the correct source page.
