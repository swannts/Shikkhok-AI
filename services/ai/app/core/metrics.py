from prometheus_client import (
    CONTENT_TYPE_LATEST,
    CollectorRegistry,
    Counter,
    Histogram,
    generate_latest,
)

# Shared Metrics Registry
registry = CollectorRegistry(auto_describe=True)

# 1. HTTP Request Latencies
http_requests_total = Counter(
    "shikkhok_ai_http_requests_total",
    "Total HTTP requests to AI service",
    ["method", "endpoint", "status_code"],
    registry=registry,
)

http_request_duration_seconds = Histogram(
    "shikkhok_ai_http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"],
    buckets=(0.02, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 20.0),
    registry=registry,
)

# 2. RAG Retrieval Metrics
rag_search_duration_seconds = Histogram(
    "shikkhok_ai_rag_search_duration_seconds",
    "Time taken to search vector store and rank chunks",
    ["subject", "grade"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.0),
    registry=registry,
)

rag_chunks_retrieved_total = Counter(
    "shikkhok_ai_rag_chunks_retrieved_total",
    "Total curriculum chunks retrieved",
    ["subject", "grade"],
    registry=registry,
)

# 3. LLM & Audio Generation Metrics
llm_generation_duration_seconds = Histogram(
    "shikkhok_ai_llm_generation_duration_seconds",
    "Time taken for LLM streaming response",
    ["model", "status"],
    buckets=(0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0),
    registry=registry,
)

voice_stt_duration_seconds = Histogram(
    "shikkhok_ai_voice_stt_duration_seconds",
    "Time taken for speech-to-text transcription",
    ["language"],
    buckets=(0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0),
    registry=registry,
)

voice_tts_duration_seconds = Histogram(
    "shikkhok_ai_voice_tts_duration_seconds",
    "Time taken for text-to-speech audio synthesis",
    ["format"],
    buckets=(0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0),
    registry=registry,
)


def get_prometheus_metrics() -> bytes:
    """Generate Prometheus scrape format output."""
    return generate_latest(registry)


def get_metrics_content_type() -> str:
    return CONTENT_TYPE_LATEST
