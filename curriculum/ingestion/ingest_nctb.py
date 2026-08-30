#!/usr/bin/env python3
"""
NCTB Curriculum Ingestion CLI
Reads structured NCTB curriculum JSON files and indexes them into the FastAPI AI vector store.
"""

import argparse
import hashlib
import hmac
import json
import os
import sys
import time
import uuid
from pathlib import Path
from typing import Any
import urllib.request
import urllib.error


def compute_hmac_signature(
    secret: str,
    timestamp: str,
    method: str,
    path: str,
    body: bytes,
) -> str:
    body_hash = hashlib.sha256(body).hexdigest()
    canonical_string = f"{timestamp}\n{method.upper()}\n{path}\n{body_hash}"
    return hmac.new(
        secret.encode("utf-8"),
        canonical_string.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def ingest_file(
    file_path: Path,
    base_url: str,
    secret: str,
    dry_run: bool = False,
) -> dict[str, Any]:
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    source_book = data.get("source_book", file_path.stem)
    book_id = data.get("book_id", file_path.stem)
    class_level = data.get("class_level", 8)
    subject_id = data.get("subject_id", "general")
    subject_title = data.get("subject_title", subject_id)
    chapter_id = data.get("chapter_id", "intro")
    chapter_title = data.get("chapter_title", chapter_id)
    pages = data.get("pages", [])

    total_chunks = 0
    print(f"📖 Processing: {source_book} (ID: {book_id}, Grade: {class_level})")

    for page in pages:
        page_number = page.get("page_number", 1)
        text = page.get("text", "")
        if not text.strip():
            continue

        payload = {
            "text": text,
            "source_book": source_book,
            "book_id": book_id,
            "class_level": class_level,
            "subject_id": subject_id,
            "subject_title": subject_title,
            "chapter_id": chapter_id,
            "chapter_title": chapter_title,
            "page_start": page_number,
            "page_end": page_number,
            "chunk_size": 300,
            "chunk_overlap": 50,
        }

        total_chunks += 1

        if dry_run:
            print(f"   [DRY-RUN] Page {page_number}: {len(text)} chars -> Validated metadata")
            continue

        body_bytes = json.dumps(payload).encode("utf-8")
        timestamp = str(int(time.time()))
        req_id = f"ingest-{uuid.uuid4().hex[:8]}"
        path = "/api/v1/ingestion/text"
        url = f"{base_url.rstrip('/')}/ingestion/text"

        sig = compute_hmac_signature(secret, timestamp, "POST", path, body_bytes)
        headers = {
            "Content-Type": "application/json",
            "X-Service-Name": "nestjs-backend",
            "X-Service-Timestamp": timestamp,
            "X-Request-Id": req_id,
            "X-Service-Signature": sig,
        }

        req = urllib.request.Request(url, data=body_bytes, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                indexed_count = result.get("indexed_count", 0)
                print(f"   ✓ Page {page_number} indexed ({indexed_count} chunks)")
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode("utf-8")
            print(f"   ✗ Page {page_number} failed ({e.code}): {err_msg}", file=sys.stderr)
        except Exception as e:
            print(f"   ✗ Page {page_number} network error: {e}", file=sys.stderr)

    return {"book_id": book_id, "pages_processed": len(pages), "chunks": total_chunks}


def main():
    parser = argparse.ArgumentParser(description="Ingest NCTB curriculum JSON files into Shikkhok AI Service")
    parser.add_argument(
        "--data-dir",
        type=str,
        default="curriculum/seed-data",
        help="Directory containing curriculum JSON files",
    )
    parser.add_argument(
        "--file",
        type=str,
        default=None,
        help="Specific single JSON file to ingest",
    )
    parser.add_argument(
        "--base-url",
        type=str,
        default=os.getenv("AI_SERVICE_BASE_URL", "http://localhost:8000/api/v1"),
        help="FastAPI AI service base URL",
    )
    parser.add_argument(
        "--secret",
        type=str,
        default=os.getenv("INTERNAL_SERVICE_SECRET", "dev-internal-ai-service-secret-at-least-32chars"),
        help="HMAC Internal Service Secret",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate JSON files without making network requests",
    )

    args = parser.parse_args()

    files = []
    if args.file:
        files.append(Path(args.file))
    else:
        data_dir = Path(args.data_dir)
        if not data_dir.exists():
            print(f"Error: Data directory '{data_dir}' does not exist.", file=sys.stderr)
            sys.exit(1)
        files = sorted(list(data_dir.glob("*.json")))

    if not files:
        print("No JSON files found to ingest.")
        sys.exit(0)

    print(f"🚀 Starting NCTB curriculum ingestion ({len(files)} files found)...\n")
    for f in files:
        ingest_file(f, args.base_url, args.secret, args.dry_run)
    print("\n✅ Ingestion process complete.")


if __name__ == "__main__":
    main()
