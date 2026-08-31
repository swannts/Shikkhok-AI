# Shikkhok AI Mobile Client Architecture Specification

## 1. Overview
The Shikkhok AI mobile client is designed as a production-grade, offline-resilient, modular Flutter application targeting low-cost Android hardware in Bangladesh.

## 2. Layers & Responsibilities

```text
┌─────────────────────────────────────────────────────────────┐
│ GoRouter Pages (lib/features/, lib/app/router/)              │
└──────────────────────────────┬──────────────────────────────┘
                               │ composes
┌──────────────────────────────▼──────────────────────────────┐
│ Feature Modules / Presentation State                        │
│ (Riverpod controllers, view models, widgets)                │
└──────────────────────────────┬──────────────────────────────┘
                               │ consumes server/client state
┌──────────────────────────────▼──────────────────────────────┐
│ Domain Repositories & Local Persistence                     │
│ (HTTP APIs, Drift/SQLite, Secure Storage, sync queue)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / SSE Stream
┌──────────────────────────────▼──────────────────────────────┐
│ Network Infrastructure (Dio, SSE parser, token storage)     │
└─────────────────────────────────────────────────────────────┘
```

## 3. Data Flow & Streaming
- **Server State**: Managed via Riverpod providers and repository-backed async notifiers.
- **Client & Auth State**: Managed via secure token storage plus local app state.
- **AI Streaming**: SSE frames are parsed into incremental tutor deltas and citations.
