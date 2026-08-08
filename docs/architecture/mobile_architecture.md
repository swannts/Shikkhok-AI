# Shikkhok AI Mobile Client Architecture Specification

## 1. Overview
The Shikkhok AI mobile client is designed as a production-grade, offline-resilient, modular React Native application targeting low-cost Android hardware in Bangladesh.

## 2. Layers & Responsibilities

```text
┌─────────────────────────────────────────────────────────────┐
│ Expo Router Pages (app/)                                     │
└──────────────────────────────┬──────────────────────────────┘
                               │ composes
┌──────────────────────────────▼──────────────────────────────┐
│ Feature Modules (src/features/)                             │
└──────────────────────────────┬──────────────────────────────┘
                               │ consumes server/client state
┌──────────────────────────────▼──────────────────────────────┐
│ Domain Repositories & State (src/api/repositories/, src/store/)│
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / SSE Stream
┌──────────────────────────────▼──────────────────────────────┐
│ HttpClient Infrastructure (src/api/httpClient.ts)           │
└─────────────────────────────────────────────────────────────┘
```

## 3. Data Flow & Streaming
- **Server State**: Managed via TanStack Query (`@tanstack/react-query`) with standardized query key factories.
- **Client & Auth State**: Managed via Zustand (`useAuthStore`, `useUIStore`).
- **AI Streaming**: Native fetch reader processing SSE `data:` frames into `onDelta(delta)` string increments.
