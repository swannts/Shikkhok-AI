# Class 3 textbook curriculum package

This directory contains the supplied Class 3 Bangla, English, and Mathematics
curriculum maps, lesson plans, and page-range PDFs. The maps provide reviewed
unit/chapter titles, learning objectives, and printed-page to original-PDF-page
references. They are not complete textbook transcripts; the original textbook
PDF remains the reading source.

Import the maps into the existing MongoDB curriculum after starting MongoDB:

```sh
MONGODB_URI="<your MongoDB URI>" node scripts/import-class3-curriculum.mjs
MONGODB_URI="<your MongoDB URI>" node scripts/import-class3-curriculum.mjs --apply
```

The first command is a read-only validation/dry run. The importer archives old
OCR placeholder chapters and lessons instead of deleting them, then updates
the existing subject and textbook records. It does not alter the supplied
PDFs, generate textbook text, or create exercises from lesson plans.

For page metadata, `pageStart`/`pageEnd` refer to printed textbook pages, while
`sourcePdfPageStart`/`sourcePdfPageEnd` refer to 1-based pages in the original
PDF. The mobile reader uses the latter to open the correct source page.
