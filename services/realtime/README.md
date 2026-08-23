# Realtime Service Guidelines (services/realtime)

> **Architectural Boundary Rule**: Do NOT implement bidirectional WebSocket / WebRTC code in this service simply because the directory exists.

## Transport & Communication Policy

1. **AI Token Streaming**:
   - **Protocol**: Server-Sent Events (SSE) via `services/ai-gateway` (`POST /ai/v1/tutor/chat/stream`).
   - **Reasoning**: Unidirectional streaming from server to client for LLM text chunks is simpler, standard, and more resilient over mobile connections.

2. **When to use `services/realtime` (WebSockets / Socket.io / WebRTC)**:
   This service is reserved strictly for features requiring **full bidirectional real-time communication**, including:
   - **Live Classrooms**: Multi-student interactive whiteboards and audio/video sync.
   - **Teacher-Student Direct Chat**: Real-time messaging with instant read receipts.
   - **Presence Tracking**: Online/offline active status of peers or classroom participants.
   - **Live Quizzes & Multiplayer Competitions**: Synchronous real-time leaderboard polling and instant answer submissions across multiple active clients.
   - **Collaborative Study Sessions**: Shared document editing and live group note taking.
