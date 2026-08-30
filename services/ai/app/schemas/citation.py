from pydantic import BaseModel, ConfigDict, Field


class CitationPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    citation_id: str = Field(..., alias="citationId")
    source_id: str = Field(..., alias="sourceId")
    source_book: str = Field(..., alias="sourceBook")
    class_level: int | None = Field(None, alias="classLevel")
    subject: str | None = None
    chapter: str | None = None
    lesson: str | None = None
    page_start: int | None = Field(None, alias="pageStart")
    page_end: int | None = Field(None, alias="pageEnd")
    excerpt: str | None = None
