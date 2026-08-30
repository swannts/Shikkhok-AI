import io
from pathlib import Path
from pypdf import PdfReader
from app.core.exceptions import AiServiceError
from app.core.logging import logger
from app.ingestion.models import ExtractedPage


class PdfParserError(AiServiceError):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message=message, code="PDF_PARSER_ERROR", status_code=status_code)


class NctbPdfParser:
    def extract_pages_from_file(self, file_path: str | Path) -> list[ExtractedPage]:
        path = Path(file_path)
        if not path.exists():
            raise PdfParserError(f"PDF file not found: {file_path}", status_code=404)

        try:
            reader = PdfReader(str(path))
            return self._extract(reader, str(path.name))
        except Exception as e:
            logger.error(f"Failed to parse PDF {file_path}: {e}")
            raise PdfParserError(f"Failed to read PDF file: {e}") from e

    def extract_pages_from_bytes(
        self,
        pdf_bytes: bytes,
        source_name: str = "document.pdf",
    ) -> list[ExtractedPage]:
        try:
            stream = io.BytesIO(pdf_bytes)
            reader = PdfReader(stream)
            return self._extract(reader, source_name)
        except Exception as e:
            logger.error(f"Failed to parse PDF bytes for {source_name}: {e}")
            raise PdfParserError(f"Failed to read PDF stream: {e}") from e

    def _extract(self, reader: PdfReader, source_name: str) -> list[ExtractedPage]:
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except Exception:
                raise PdfParserError(f"PDF '{source_name}' is password protected and cannot be read.") from None

        pages: list[ExtractedPage] = []
        for page_idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            cleaned = text.strip()
            # Retain non-empty extracted pages
            if cleaned:
                pages.append(
                    ExtractedPage(
                        page_number=page_idx + 1,
                        text=cleaned,
                    )
                )

        logger.info(
            f"Extracted {len(pages)} non-empty pages from '{source_name}' (Total pages: {len(reader.pages)})"
        )
        return pages
