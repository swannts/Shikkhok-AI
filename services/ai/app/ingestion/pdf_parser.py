import io
from pathlib import Path

import pytesseract
from pdf2image import convert_from_bytes
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
            pdf_bytes = path.read_bytes()
            return self.extract_pages_from_bytes(pdf_bytes, path.name)
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
            pages = self._extract(reader, source_name)
            if pages:
                return pages
            logger.info("No embedded text in '%s'; attempting Bengali OCR", source_name)
            return self._ocr(pdf_bytes, source_name)
        except Exception as e:
            logger.error(f"Failed to parse PDF bytes for {source_name}: {e}")
            raise PdfParserError(f"Failed to read PDF stream: {e}") from e

    def _extract(self, reader: PdfReader, source_name: str) -> list[ExtractedPage]:
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except Exception:
                raise PdfParserError(
                    f"PDF '{source_name}' is password protected and cannot be read."
                ) from None

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

    def _ocr(self, pdf_bytes: bytes, source_name: str) -> list[ExtractedPage]:
        try:
            images = convert_from_bytes(pdf_bytes, dpi=180, fmt="png")
            pages: list[ExtractedPage] = []
            for page_number, image in enumerate(images, start=1):
                text = pytesseract.image_to_string(image, lang="ben+eng").strip()
                if text:
                    pages.append(ExtractedPage(page_number=page_number, text=text))
            logger.info("OCR extracted %d pages from '%s'", len(pages), source_name)
            if not pages:
                raise PdfParserError(
                    f"PDF '{source_name}' contains no extractable text and OCR returned no text."
                )
            return pages
        except PdfParserError:
            raise
        except Exception as e:
            logger.error("OCR failed for %s: %s", source_name, e)
            raise PdfParserError(f"OCR failed for PDF '{source_name}': {e}") from e
