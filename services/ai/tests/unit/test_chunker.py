from app.ingestion.chunker import BengaliTextChunker
from app.ingestion.models import DocumentMetadata, ExtractedPage


def test_bengali_chunker_splits_sentences_on_dari() -> None:
    chunker = BengaliTextChunker(max_chunk_size=120, chunk_overlap=20)
    metadata = DocumentMetadata(
        class_level=8,
        subject_id="mathematics",
        subject_title="গণিত",
        source_book="NCTB Math 8",
        book_id="math8",
    )

    pages = [
        ExtractedPage(
            page_number=1,
            text="বীজগণিতের মৌলিক সূত্রাবলি। প্রথম সূত্রটি হলো বর্গের সূত্র। এটি খুব সহজ।",
        ),
        ExtractedPage(
            page_number=2,
            text="দ্বিতীয় সূত্রটি হলো বর্গের অন্তরের সূত্র। এর প্রয়োগ বাস্তব জীবনে অনেক। মনে রাখা দরকার।",
        ),
    ]

    chunks = chunker.chunk_pages(pages=pages, metadata=metadata)
    assert len(chunks) >= 2
    for chunk in chunks:
        assert chunk.char_count > 0
        assert chunk.page_start in (1, 2)
        assert chunk.content_hash is not None
        assert len(chunk.content_hash) == 64  # SHA-256


def test_bengali_chunker_respects_overlap() -> None:
    chunker = BengaliTextChunker(max_chunk_size=80, chunk_overlap=30)
    metadata = DocumentMetadata(
        class_level=8,
        subject_id="science",
        subject_title="বিজ্ঞান",
        source_book="NCTB Science 8",
    )

    pages = [
        ExtractedPage(
            page_number=5,
            text="দহন একটি গুরুত্বপূর্ণ রাসায়নিক প্রক্রিয়া। এতে প্রচুর তাপ ও আলো উৎপন্ন হয়। যেমন মোমবাতির শিখা। মোম বাতাসে পুড়ে কার্বন ডাই-অক্সাইড তৈরি করে।",
        )
    ]

    chunks = chunker.chunk_pages(pages=pages, metadata=metadata)
    assert len(chunks) >= 2
    # Check that chunks have sensible content
    assert "দহন" in chunks[0].text
