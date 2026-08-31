from typing import Any

from app.schemas.retrieval import RetrievalFilter


def build_retrieval_scope_chain(filter_params: RetrievalFilter) -> list[dict[str, Any]]:
    hard_constraints = {
        key: value
        for key, value in {
            "class_level": filter_params.class_level,
            "subject_id": filter_params.subject_id,
            "curriculum_version": filter_params.curriculum_version,
            "academic_year": filter_params.academic_year,
            "curriculum_year": filter_params.curriculum_year,
            "medium": filter_params.medium,
        }.items()
        if value is not None
    }

    if not hard_constraints:
        return [{}]

    scopes: list[dict[str, Any]] = []

    if filter_params.lesson_id is not None:
        scope = dict(hard_constraints)
        scope["lesson_id"] = filter_params.lesson_id
        if filter_params.chapter_id is not None:
            scope["chapter_id"] = filter_params.chapter_id
        scopes.append(scope)

    if filter_params.chapter_id is not None:
        scope = dict(hard_constraints)
        scope["chapter_id"] = filter_params.chapter_id
        scopes.append(scope)

    scopes.append(dict(hard_constraints))

    unique_scopes: list[dict[str, Any]] = []
    seen: set[tuple[tuple[str, Any], ...]] = set()
    for scope in scopes:
        scope_key = tuple(sorted(scope.items()))
        if scope_key in seen:
            continue
        seen.add(scope_key)
        unique_scopes.append(scope)

    return unique_scopes


def active_version_key(chunk: dict[str, Any]) -> str:
    book_id = str(chunk.get("book_id") or "").strip()
    lesson_id = str(chunk.get("lesson_id") or "").strip()
    chapter_id = str(chunk.get("chapter_id") or "").strip()
    chunk_id = str(chunk.get("chunk_id") or "").strip()
    content_hash = str(chunk.get("content_hash") or "").strip()

    if book_id and lesson_id:
        return f"book:{book_id}:lesson:{lesson_id}"
    if book_id and chapter_id:
        return f"book:{book_id}:chapter:{chapter_id}"
    if book_id:
        return f"book:{book_id}"
    if chunk_id:
        return f"chunk:{chunk_id}"
    if content_hash:
        return f"hash:{content_hash}"
    return f"text:{str(chunk.get('text') or '').strip()}"


def chunk_matches_scope(chunk: dict[str, Any], scope: dict[str, Any]) -> bool:
    return all(chunk.get(key) == value for key, value in scope.items())
