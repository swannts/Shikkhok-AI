from typing import Any

from app.schemas.retrieval import RetrievalFilter


def build_retrieval_scope_chain(filter_params: RetrievalFilter) -> list[dict[str, Any]]:
    hard_constraints = {
        key: value
        for key, value in {
            "class_level": filter_params.class_level,
            "subject_id": filter_params.subject_id,
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


def chunk_matches_scope(chunk: dict[str, Any], scope: dict[str, Any]) -> bool:
    return all(chunk.get(key) == value for key, value in scope.items())
