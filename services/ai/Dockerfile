# syntax=docker/dockerfile:1
FROM python:3.12-slim AS builder

WORKDIR /app

# Install uv for fast, reliable dependency resolution
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

COPY pyproject.toml .
RUN uv sync --no-dev --frozen || uv sync --no-dev

FROM python:3.12-slim AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

# Copy virtual environment and source code
COPY --from=builder /app/.venv /app/.venv
COPY app /app/app
COPY pyproject.toml /app/

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    APP_ENV=production

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
