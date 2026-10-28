#!/usr/bin/env python3
"""Build and validate downloadable, page-complete NCTB lesson packages."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import re
import shutil
import tempfile
import zipfile
from collections import Counter
from pathlib import Path
from typing import Any

from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parents[1]
BOOKS = ROOT / "books"
DEFAULT_OUTPUT = ROOT / "dist" / "textbook-lesson-packages"

SOURCE_BY_DIRECTORY = {
    "bangla-class2": "data/curriculum-uploads/class-2-amar-bangla-boi.pdf",
    "english-class2": "data/curriculum-uploads/class-2-english-for-today.pdf",
    "math-class2": "data/curriculum-uploads/class-2-primary-math.pdf",
    "bangla-class3": "data/curriculum-uploads/amar-bangla-boi.pdf",
    "bgs-class-3": "data/curriculum-uploads/class-3-bangladesh-and-global-studies.pdf",
    "buddhist-class3": "data/curriculum-uploads/class-3-buddhist-religion-studies.pdf",
    "christian-class3": "data/curriculum-uploads/class-3-christian-religion-studies.pdf",
    "english-class3": "data/curriculum-uploads/class-3-english-for-today.pdf",
    "hindu-class3": "data/curriculum-uploads/class-3-hindu-religion-studies.pdf",
    "islamic-class3": "data/curriculum-uploads/class-3-islamic-studies.pdf",
    "math-class3": "data/curriculum-uploads/class-3-primary-math.pdf",
    "science-class3": "data/curriculum-uploads/class-3-primary-science.pdf",
}

SUBJECT_SLUG = {
    "বাংলা": "bangla",
    "Bangla": "bangla",
    "bangla": "bangla",
    "English": "english",
    "english": "english",
    "Mathematics": "math",
    "math": "math",
    "math-bn": "math",
    "Science": "science",
    "Bangladesh and Global Studies": "bgs",
}


def source_range(obj: dict[str, Any]) -> list[int] | None:
    value = obj.get("pdf_pages_1_based") or obj.get("source_pdf_pages_1_based")
    if isinstance(value, list) and len(value) == 2:
        start, end = value
        if isinstance(start, int) and isinstance(end, int) and start <= end:
            return [start, end]
    return None


def lesson_rows(data: dict[str, Any]) -> list[dict[str, Any]]:
    return data.get("lessons") or data.get("units") or []


def split_pdf_name(lesson: dict[str, Any]) -> str | None:
    return lesson.get("source", {}).get("split_pdf")


def add_pages(writer: PdfWriter, reader: PdfReader, page_numbers: list[int]) -> None:
    for page_number in page_numbers:
        writer.add_page(reader.pages[page_number - 1])


def format_page_numbers(numbers: list[int]) -> str:
    if not numbers:
        return "none; all source pages are already mapped"
    ranges: list[str] = []
    start = previous = numbers[0]
    for number in numbers[1:]:
        if number == previous + 1:
            previous = number
            continue
        ranges.append(str(start) if start == previous else f"{start}–{previous}")
        start = previous = number
    ranges.append(str(start) if start == previous else f"{start}–{previous}")
    return ", ".join(ranges)


def normalize_bangla_class3(data: dict[str, Any]) -> None:
    """Expose legacy unit records as the explicit lesson/chapter/question schema."""
    units = data.get("units", [])
    sessions_by_id = {item["id"]: item for item in data.get("sessions", [])}
    questions: list[dict[str, Any]] = []
    lessons: list[dict[str, Any]] = []
    chapters: list[dict[str, Any]] = []

    for sequence, unit in enumerate(units, 1):
        unit_id = unit["id"]
        check = unit.get("starter_check") or {}
        check_id = f"{unit_id}-q1"
        source = copy.deepcopy(unit.get("source", {}))
        source["source_pdf_filename"] = data["book"].get("source_filename")
        source["printed_pages"] = source.get("printed_pages")
        sessions = [sessions_by_id[sid] for sid in unit.get("session_ids", []) if sid in sessions_by_id]
        question: dict[str, Any] = {
            "id": check_id,
            "lesson_id": unit_id,
            "origin": "app_authored_not_textbook_exercise",
            "source_pdf_pages_1_based": source.get("pdf_pages_1_based"),
            "language": "bn-BD",
            **copy.deepcopy(check),
        }
        question.pop("id", None)
        question["id"] = check_id
        question["lesson_id"] = unit_id
        question["origin"] = "app_authored_not_textbook_exercise"
        question["source_pdf_pages_1_based"] = source.get("pdf_pages_1_based")
        option_index = question.get("correct_option_index")
        options = question.get("options_bn") or []
        if isinstance(option_index, int) and 0 <= option_index < len(options):
            question["expected_answer"] = options[option_index]
        questions.append(question)

        chapters.append({
            "id": unit_id,
            "order": sequence,
            "title": unit.get("title_bn"),
            "kind": "textbook_lesson_unit",
            "source": copy.deepcopy(unit.get("source", {})),
            "teacher_review_status": "draft_requires_teacher_review",
        })
        lessons.append({
            "id": unit_id,
            "chapter_id": unit_id,
            "sequence": sequence,
            "title": unit.get("title_bn"),
            "title_origin": "textbook_contents_heading_pending_visual_teacher_confirmation",
            "learning_objectives": [unit.get("learning_objective_bn", "")],
            "key_concepts": [],
            "prerequisite_lesson_ids": unit.get("prerequisite_unit_ids", []),
            "source": source,
            "source_pdf_filename": data["book"].get("source_filename"),
            "source_pdf_page_range": source.get("pdf_pages_1_based"),
            "printed_page_range": source.get("printed_pages"),
            "source_pdf_filename_for_lesson": data["book"].get("source_filename"),
            "split_pdf": source.get("split_pdf"),
            "app_authored_activity": unit.get("original_practice_bn"),
            "question_ids": [check_id],
            "session_ids": unit.get("session_ids", []),
            "suggested_sessions": copy.deepcopy(sessions),
            "teacher_review_notes": [
                "Draft teaching guidance and question; verify against the original scanned pages before publishing.",
                "The source scan has no verified text layer; OCR/transcription is not included.",
            ],
            "publication_status": "draft_requires_teacher_review",
        })

    data["chapters"] = chapters
    data["lessons"] = lessons
    data["questions"] = questions
    book = data["book"]
    book["subject"] = "Bangla"
    book["education_stream"] = None
    book["edition_year"] = None
    book["edition_year_status"] = "not_identified_from_available_source"
    data["teacher_review_notes"] = [
        "The cover identifies the title and Class 3; the edition/year is not legible/available in the provided scan metadata.",
        "All lesson boundaries and app-authored teaching material remain drafts for teacher review.",
    ]


def normalize_curriculum(data: dict[str, Any], package_stem: str) -> None:
    book = data.setdefault("book", {})
    grade = book.get("grade")
    subject = book.get("subject") or book.get("title") or book.get("title_bn")
    language = book.get("language")
    if not language and "english" in package_stem:
        language = "en"
        book["language"] = language
    book["education_stream"] = book.get("education_stream", book.get("school_stream"))
    book["edition_year"] = book.get("edition_year", book.get("edition_year_printed_in_book"))
    book["source_pdf_page_count"] = book.get("total_pdf_pages")
    book["source_pdf_filename"] = book.get("source_pdf_filename", book.get("source_filename"))
    academic_year_match = re.search(r"academic-year\s+(20\d{2})", book.get("edition_note", ""), re.IGNORECASE)
    if academic_year_match:
        book.setdefault("academic_year", int(academic_year_match.group(1)))

    lessons = lesson_rows(data)
    units_by_id = {unit.get("id"): unit for unit in data.get("units", [])}
    chapters = data.get("chapters", [])
    chapter_ids = {chapter.get("id") for chapter in chapters}
    root_chapter_id = book.get("id") or f"class{grade}-{package_stem}-book"
    if not chapters and units_by_id:
        chapters = [
            {
                "id": unit_id,
                "order": unit.get("order", index),
                "title": unit.get("title") or unit.get("title_bn"),
                "source": copy.deepcopy(unit.get("source", {})),
                "kind": "textbook_unit",
                "teacher_review_status": "draft_requires_teacher_review",
            }
            for index, (unit_id, unit) in enumerate(units_by_id.items(), 1)
        ]
        data["chapters"] = chapters
        chapter_ids = {chapter.get("id") for chapter in chapters}
    if not chapters and not units_by_id:
        chapters = [{
            "id": root_chapter_id,
            "order": 1,
            "title": book.get("title") or book.get("title_bn"),
            "kind": "book_level_container_no_printed_chapter_hierarchy",
            "teacher_review_status": "draft_requires_teacher_review",
        }]
        data["chapters"] = chapters
        chapter_ids.add(root_chapter_id)

    sessions_by_id = {session.get("id"): session for session in data.get("sessions", [])}
    questions_by_id = {question.get("id"): question for question in data.get("questions", []) if question.get("id")}
    questions = data.setdefault("questions", [])

    for order, lesson in enumerate(lessons, 1):
        unit = units_by_id.get(lesson.get("unit_id"))
        src = lesson.get("source", {})
        if not src and unit:
            src = unit.get("source", {})
            lesson["source"] = src
        lesson.setdefault("sequence", lesson.get("global_order", lesson.get("order", order)))
        lesson.setdefault("title", lesson.get("title_bn") or lesson.get("textbook_title") or lesson.get("title_en"))
        lesson.setdefault("chapter_id", lesson.get("unit_id") or src.get("chapter_id") or root_chapter_id)
        if lesson.get("chapter_id") not in chapter_ids and chapters:
            # Some class-3 English curricula call textbook units rather than chapters.
            unit_row = units_by_id.get(lesson.get("chapter_id"))
            if unit_row:
                unit_title = unit_row.get("title_bn") or unit_row.get("title")
                chapters.append({"id": lesson["chapter_id"], "order": unit_row.get("order", order), "title": unit_title, "kind": "textbook_unit"})
                chapter_ids.add(lesson["chapter_id"])
            elif lesson.get("chapter_id") == root_chapter_id:
                chapter_ids.add(root_chapter_id)

        lesson["source_pdf_filename"] = book.get("source_pdf_filename")
        lesson["source_pdf_page_range"] = source_range(src)
        lesson["printed_page_range"] = src.get("printed_pages")
        lesson.setdefault("learning_objectives", [
            lesson.get("objective") or lesson.get("objective_bn") or lesson.get("objective_en")
        ] if any(lesson.get(key) for key in ("objective", "objective_bn", "objective_en")) else [])
        lesson.setdefault("key_concepts", lesson.get("focus_vocabulary", {}).get("words", []))

        session_ids = lesson.get("session_ids", [])
        nested_sessions = [copy.deepcopy(sessions_by_id[sid]) for sid in session_ids if sid in sessions_by_id]
        if nested_sessions:
            lesson["suggested_sessions"] = nested_sessions
        elif unit:
            nested_sessions = [copy.deepcopy(sessions_by_id[sid]) for sid in unit.get("session_ids", []) if sid in sessions_by_id]
            lesson["suggested_sessions"] = nested_sessions
            lesson["session_ids"] = [session["id"] for session in nested_sessions]

        starter = lesson.get("starter_check") or (unit or {}).get("starter_check")
        if starter:
            question_id = starter.get("id") or f"{lesson.get('id', package_stem)}-q1"
            if question_id not in questions_by_id:
                question = copy.deepcopy(starter)
                question.update({"id": question_id, "lesson_id": lesson.get("id"), "origin": "app_authored_not_textbook_exercise"})
                options = question.get("options") or question.get("options_bn") or []
                index = question.get("correct_option_index")
                if isinstance(index, int) and 0 <= index < len(options):
                    question["expected_answer"] = options[index]
                question.setdefault("source_pdf_pages_1_based", source_range(src))
                questions.append(question)
                questions_by_id[question_id] = question
            lesson.setdefault("question_ids", [question_id])

        if not lesson.get("question_ids"):
            lesson["question_ids"] = [qid for qid, q in questions_by_id.items() if q.get("lesson_id") == lesson.get("id")]
        lesson.setdefault("teacher_review_notes", ["Draft teaching guidance and questions require teacher review against the cited source pages."])
        lesson.setdefault("publication_status", "draft_requires_teacher_review")

    data["package_metadata"] = {
        "subject": subject,
        "class_level": grade,
        "language": language,
        "education_stream": book.get("education_stream"),
        "edition_year": book.get("edition_year"),
        "source_pdf_filename": book.get("source_pdf_filename"),
        "source_pdf_page_count": book.get("source_pdf_page_count"),
        "publication_status": "draft_requires_teacher_review_before_publishing",
        "uncertain_metadata_is_null_not_inferred": True,
    }
    if not book.get("edition_year") and not book.get("academic_year"):
        data.setdefault("teacher_review_notes", []).append(
            "Edition/academic year was not established from available source metadata; it is left null."
        )
    if not book.get("education_stream"):
        data.setdefault("teacher_review_notes", []).append(
            "Education stream is not explicit in available metadata; it is left null rather than inferred."
        )


def fix_bgs_boundary(data: dict[str, Any], source: PdfReader, package_pdf_dir: Path) -> None:
    """Assign the shared fire/flood page only to the flood lesson in the ZIP."""
    fire = next(item for item in data["lessons"] if item.get("id") == "bgs3-c12-l01")
    fire_range = [110, 111]
    fire["source"]["pdf_pages_1_based"] = fire_range
    fire["source"]["printed_pages"] = [105, 106]
    fire["source_pdf_page_range"] = fire_range
    fire["printed_page_range"] = [105, 106]

    writer = PdfWriter()
    add_pages(writer, source, fire_range)
    with (package_pdf_dir / fire["source"]["split_pdf"].split("/")[-1]).open("wb") as handle:
        writer.write(handle)

    for session in data.get("sessions", []):
        if session.get("lesson_id") == fire["id"]:
            session["source_pdf_pages_1_based"] = fire_range
    for session in fire.get("suggested_sessions", []):
        session["source_pdf_pages_1_based"] = fire_range
    fire_question_ids = set(fire.get("question_ids", []))
    for question in data.get("questions", []):
        if question.get("id") in fire_question_ids:
            question["source_pdf_pages_1_based"] = fire_range


def source_page_references(data: dict[str, Any]) -> list[int]:
    refs: list[int] = []
    for lesson in lesson_rows(data):
        source = lesson.get("source", {})
        span = source_range(source)
        if span:
            refs.extend(range(span[0], span[1] + 1))
    for resource in data.get("supplementary_resources", []):
        explicit_pages = resource.get("source_pdf_page_numbers_1_based")
        if isinstance(explicit_pages, list):
            refs.extend(page for page in explicit_pages if isinstance(page, int))
            continue
        span = source_range(resource)
        if span:
            refs.extend(range(span[0], span[1] + 1))
    return refs


def write_support_pdf(source_path: Path, pages: list[int], target: Path) -> None:
    reader = PdfReader(str(source_path))
    writer = PdfWriter()
    add_pages(writer, reader, pages)
    with target.open("wb") as handle:
        writer.write(handle)


def validate_data(data: dict[str, Any], package_root: Path, source_pages: int) -> list[str]:
    problems: list[str] = []
    lessons = lesson_rows(data)
    lesson_ids = [lesson.get("id") for lesson in lessons]
    if not lesson_ids or any(not item for item in lesson_ids) or len(set(lesson_ids)) != len(lesson_ids):
        problems.append("lesson IDs are absent or duplicated")
    chapters = {chapter.get("id") for chapter in data.get("chapters", [])}
    questions = data.get("questions", [])
    question_ids = [question.get("id") for question in questions]
    if len(question_ids) != len(set(question_ids)):
        problems.append("question IDs are duplicated")

    session_map = {session.get("id"): session for session in data.get("sessions", [])}
    question_map = {question.get("id"): question for question in questions}
    for lesson in lessons:
        if lesson.get("chapter_id") not in chapters:
            problems.append(f"{lesson.get('id')}: chapter ID has no chapter record")
        refs = lesson.get("session_ids", [])
        nested = lesson.get("suggested_sessions", [])
        if len(refs) != 3 or len(nested) != 3:
            problems.append(f"{lesson.get('id')}: expected exactly 3 suggested sessions")
        for sid in refs:
            session = session_map.get(sid)
            if not session:
                problems.append(f"{lesson.get('id')}: missing session {sid}")
                continue
            steps = session.get("steps", [])
            duration = sum(step.get("minutes", step.get("duration_minutes", 0)) for step in steps)
            if session.get("estimated_minutes", 8) != 8 or (steps and duration != 8):
                problems.append(f"{sid}: session is not 8 minutes")
        for qid in lesson.get("question_ids", []):
            if qid not in question_map:
                problems.append(f"{lesson.get('id')}: missing question {qid}")
    for question in questions:
        options = question.get("options") or question.get("options_bn")
        index = question.get("correct_option_index")
        if options is not None and (not isinstance(index, int) or not 0 <= index < len(options)):
            problems.append(f"{question.get('id')}: invalid expected-answer choice")

    files = list((package_root / "lesson-pdfs").glob("*.pdf"))
    if not files:
        problems.append("no PDFs in lesson-pdfs")
    for file_path in files:
        try:
            if not PdfReader(str(file_path)).pages:
                problems.append(f"empty PDF: {file_path.name}")
        except Exception as exc:  # noqa: BLE001 - validation reports the file boundary
            problems.append(f"invalid PDF {file_path.name}: {exc}")
    for lesson in lessons:
        rel = split_pdf_name(lesson)
        if rel and not (package_root / rel).is_file():
            problems.append(f"missing referenced lesson PDF: {rel}")
    for resource in data.get("supplementary_resources", []):
        rel = resource.get("split_pdf")
        if not rel and (source_range(resource) or resource.get("source_pdf_page_numbers_1_based")):
            problems.append(f"supporting resource has source pages but no PDF reference: {resource.get('title') or resource.get('title_bn')}")
        if rel and not (package_root / rel).is_file():
            problems.append(f"missing referenced supporting PDF: {rel}")
        if rel and (package_root / rel).is_file():
            expected_pages = resource.get("source_pdf_page_numbers_1_based")
            span = source_range(resource)
            if expected_pages is not None:
                expected_count = len(expected_pages)
            elif span:
                expected_count = span[1] - span[0] + 1
            else:
                expected_count = None
            if expected_count is not None:
                actual_count = len(PdfReader(str(package_root / rel)).pages)
                if actual_count != expected_count:
                    problems.append(f"{rel}: supporting PDF has {actual_count} pages; expected {expected_count}")
    if len(source_page_references(data)) != source_pages:
        problems.append("mapped source pages do not cover the complete source exactly once")
    return problems


def make_package(directory: Path, output: Path) -> tuple[Path, dict[str, Any]]:
    curriculum_path = next(directory.glob("*-curriculum.json"))
    plan_path = next(directory.glob("*-lesson-plan.md"))
    package_stem = curriculum_path.name.removesuffix("-curriculum.json")
    data = json.loads(curriculum_path.read_text(encoding="utf-8"))

    # The hindi-class3 directory is a byte-identical duplicate of the Bengali
    # Hindu-religion package and is intentionally omitted from the main loop.
    normalize_bangla_class3(data) if directory.name == "bangla-class3" else None
    normalize_curriculum(data, package_stem)
    if directory.name == "bangla-class3":
        for resource in data.get("supplementary_resources", []):
            if resource.get("pdf_pages_1_based") == [108, 109] and not resource.get("split_pdf"):
                resource["split_pdf"] = "lesson-pdfs/30-word-bank.pdf"

    source_rel = SOURCE_BY_DIRECTORY.get(directory.name)
    source_path = ROOT / source_rel if source_rel else None
    source_reader = PdfReader(str(source_path)) if source_path else None
    source_page_count = len(source_reader.pages) if source_reader else data["book"].get("total_pdf_pages")
    if not isinstance(source_page_count, int):
        raise ValueError(f"Missing source page count for {directory}")
    if data["book"].get("total_pdf_pages") != source_page_count:
        raise ValueError(f"Source PDF page count mismatch for {directory}: {source_page_count}")

    with tempfile.TemporaryDirectory(prefix="nctb-package-") as temp_name:
        stage = Path(temp_name)
        pdf_dir = stage / "lesson-pdfs"
        shutil.copytree(directory / "lesson-pdfs", pdf_dir)

        if directory.name == "bgs-class-3":
            assert source_reader is not None
            fix_bgs_boundary(data, source_reader, pdf_dir)
            plan_text = plan_path.read_text(encoding="utf-8")
            plan_text = plan_text.replace(
                "Printed page 107 / PDF page 112 includes the end of the fire section and the start of the flood section. It is deliberately included in both lesson PDFs. All other chapter pages are covered once.",
                "Printed page 107 / PDF page 112 contains the end of the fire section at the top and the flood heading below. The shared page is assigned once to the flood lesson; the fire lesson ends at PDF page 111.",
            )
            plan_text = plan_text.replace("105-107 | 110-112", "105-106 | 110-111")
            data["teacher_review_notes"] = data.get("teacher_review_notes", []) + [
                "PDF page 112 contains the final fire activity and the flood lesson heading; it is assigned once to the flood lesson to prevent duplicate pages. Teacher should review the cross-boundary page.",
            ]
        else:
            plan_text = plan_path.read_text(encoding="utf-8")

        refs = source_page_references(data)
        counts = Counter(refs)
        overlap = sorted(page for page, count in counts.items() if count != 1)
        if overlap:
            raise ValueError(f"Overlapping/unmapped lesson source references in {directory.name}: {overlap[:20]}")
        if any(page < 1 or page > source_page_count for page in refs):
            raise ValueError(f"Source page reference outside source in {directory.name}")

        missing_pages = sorted(set(range(1, source_page_count + 1)) - set(refs))
        if missing_pages:
            if source_reader is None:
                raise ValueError(f"Cannot restore unassigned original pages without source PDF: {directory.name}: {missing_pages[:20]}")
            target = pdf_dir / "000-supporting-unmapped-pages.pdf"
            write_support_pdf(source_path, missing_pages, target)
            data.setdefault("supplementary_resources", []).append({
                "title": "Original pages not assigned to a lesson (cover, contents, end matter, or other source pages)",
                "source_pdf_page_numbers_1_based": missing_pages,
                "split_pdf": f"lesson-pdfs/{target.name}",
                "teacher_review_note": "Page classification is intentionally not guessed; inspect the included original pages.",
            })

        # Ensure every lesson split exists and contains exactly its mapped range.
        for lesson in lesson_rows(data):
            rel = split_pdf_name(lesson)
            if not rel:
                continue
            pdf_path = stage / rel
            if not pdf_path.is_file():
                raise ValueError(f"Missing lesson PDF {rel} for {directory.name}")
            span = source_range(lesson.get("source", {}))
            if span and len(PdfReader(str(pdf_path)).pages) != span[1] - span[0] + 1:
                raise ValueError(f"Page count disagrees with source range: {directory.name}/{rel}")

        data["package_metadata"]["all_original_source_pages_included_once"] = True
        data["package_metadata"]["supporting_pages_unclassified"] = missing_pages
        data["package_metadata"]["review_limitation"] = (
            "Generated tutoring content is draft material and must be checked by a teacher against the cited original pages."
        )
        data["package_metadata"]["lesson_count"] = len(lesson_rows(data))
        data["package_metadata"]["session_count"] = len(data.get("sessions", []))
        data["package_metadata"]["question_count"] = len(data.get("questions", []))
        book = data["book"]
        (stage / curriculum_path.name).write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )

        draft_note = (
            "> **DRAFT — TEACHER REVIEW REQUIRED BEFORE PUBLISHING.** Lesson boundaries, objectives, "
            "activities, questions and expected answers are app-authored or proposed guidance, not a "
            "verified textbook transcription. Verify every answer against the cited page images.\n\n"
        )
        tutor_guidance = """

## Tutor guidance (draft for teacher review)

- Speak and explain in the book's language and at the learner's class level. Use short, concrete explanations and ask one question at a time.
- Let the learner reason aloud. Offer a small hint or point to the relevant source page before giving an answer; correct gently and explain why.
- Check understanding with a new example or a child explanation, not a single multiple-choice response alone.
- Treat dates, statistics and historical figures as statements from this edition of the textbook, not automatically as current facts.
- Present religious material respectfully and follow the book's wording; do not invent doctrine, prayer text or pronunciations. Teacher-approve any religious narration/audio.
- A citation must refer to an included source page. Null audio, transcript, image-crop or interaction fields mean those assets do not exist in this package.

All lesson plans and starter questions in this package remain **drafts for teacher review before publishing**.
"""
        package_index = [
            "\n\n## Package index and counts (generated from curriculum JSON)\n\n",
            f"- Class: {book.get('grade')}\n",
            f"- Subject: {book.get('subject') or book.get('title') or book.get('title_bn')}\n",
            f"- Language: {book.get('language') or 'not established'}\n",
            f"- Education stream: {book.get('education_stream') or 'not established'}\n",
            f"- Edition/academic year: {book.get('edition_year') or book.get('academic_year') or 'not established'}\n",
            f"- Lessons: {len(lesson_rows(data))}; sessions: {len(data.get('sessions', []))}; starter questions: {len(data.get('questions', []))}.\n\n",
            "Every original source page is included exactly once across lesson and supporting PDFs. Pages called excluded from lessons in the older notes are still preserved as supporting material.\n\n",
            f"- Original pages not assigned to lessons (included in `000-supporting-unmapped-pages.pdf`): {format_page_numbers(missing_pages)}.\n\n",
            "| # | Lesson ID | Title | Original PDF pages | Printed pages | Split PDF |\n",
            "|---:|---|---|---:|---:|---|\n",
        ]
        for index, lesson in enumerate(lesson_rows(data), 1):
            source = lesson.get("source", {})
            pdf_range = source_range(source)
            pdf_text = f"{pdf_range[0]}–{pdf_range[1]}" if pdf_range else "not identified"
            printed = source.get("printed_pages")
            printed_text = f"{printed[0]}–{printed[1]}" if isinstance(printed, list) and len(printed) == 2 else "not identified"
            title = str(lesson.get("title") or lesson.get("title_bn") or lesson.get("textbook_title") or "Untitled").replace("|", "\\|")
            package_index.append(
                f"| {index} | `{lesson.get('id')}` | {title} | {pdf_text} | {printed_text} | `{split_pdf_name(lesson) or 'not identified'}` |\n"
            )
        package_index.append(
            "\nStarter checks and app-authored expected answers are detailed in the curriculum JSON and the lesson-plan sections above. "
            "Session step durations are stored per session and validated to total eight minutes.\n"
        )
        if "DRAFT — TEACHER REVIEW" not in plan_text:
            plan_text = draft_note + plan_text
        if "## Tutor guidance (draft for teacher review)" not in plan_text:
            plan_text += tutor_guidance
        plan_text += "".join(package_index)
        (stage / plan_path.name).write_text(plan_text, encoding="utf-8")

        issues = validate_data(data, stage, source_page_count)
        if issues:
            raise ValueError(f"Package validation failed for {directory.name}: " + "; ".join(issues[:12]))

        book = data["book"]
        subject = SUBJECT_SLUG.get(str(book.get("subject", "")), package_stem.split("-")[0])
        grade = book["grade"]
        lang_code = str(book.get("language") or "unknown").split("-")[0].lower()
        stream = book.get("education_stream")
        year = book.get("edition_year") or book.get("academic_year")
        tokens = [subject, f"class{grade}"]
        if stream:
            tokens.append(re.sub(r"[^a-z0-9]+", "-", str(stream).lower()).strip("-"))
        tokens += [lang_code, str(year) if year else "year-unspecified", "lesson-pdfs"]
        zip_path = output / ("-".join(tokens) + ".zip")
        output.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
            for item in sorted(stage.rglob("*")):
                if item.is_file():
                    archive.write(item, item.relative_to(stage).as_posix())
        with zipfile.ZipFile(zip_path) as archive:
            bad_member = archive.testzip()
            if bad_member:
                raise ValueError(f"ZIP integrity error in {zip_path}: {bad_member}")
            names = set(archive.namelist())
            if curriculum_path.name not in names or plan_path.name not in names or not any(name.startswith("lesson-pdfs/") for name in names):
                raise ValueError(f"ZIP layout incomplete: {zip_path}")

    return zip_path, data


def is_duplicate_hindu_alias(directory: Path) -> bool:
    if directory.name != "hindi-class3":
        return False
    other = directory.parent / "hindu-class3"
    try:
        own_json = next(directory.glob("*-curriculum.json"))
        other_json = next(other.glob("*-curriculum.json"))
        return hashlib.sha256(own_json.read_bytes()).digest() == hashlib.sha256(other_json.read_bytes()).digest()
    except (StopIteration, OSError):
        return False


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    output = args.output.resolve()
    summaries = []
    directories = sorted(path.parent for path in BOOKS.glob("**/*-curriculum.json"))
    for directory in directories:
        if is_duplicate_hindu_alias(directory):
            print(f"SKIP duplicate directory alias: {directory.relative_to(ROOT)}")
            continue
        archive, data = make_package(directory, output)
        summary = {
            "zip": archive,
            "grade": data["book"].get("grade"),
            "subject": data["book"].get("subject") or data["book"].get("title_bn") or data["book"].get("title"),
            "language": data["book"].get("language"),
            "lessons": len(lesson_rows(data)),
            "bytes": archive.stat().st_size,
            "source_pages": data["book"].get("total_pdf_pages"),
            "teacher_review": True,
        }
        summaries.append(summary)
        print(json.dumps({**summary, "zip": str(archive)}, ensure_ascii=False))
    print(f"PACKAGES_CREATED={len(summaries)}")


if __name__ == "__main__":
    main()
