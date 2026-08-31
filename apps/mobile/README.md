# Shikkhok AI Mobile Application

Flutter client for the Shikkhok-AI student and parent experience.

## Architecture Highlights

- GoRouter-based navigation for auth, onboarding, learning, tutor, progress, notifications, and profile flows.
- Riverpod state management with feature-scoped controllers and repositories.
- Drift/SQLite persistence for offline-first reads, sync queue support, and local checkpoints.
- Secure token storage for session restoration.
- Bangla-first UI with English localization support.
- Dio-based API client with SSE parsing for tutor streaming.

## Source Layout

```text
lib/
├── app/            # app bootstrap, router, localization, theme
├── core/           # network, storage, database, errors, shared widgets
├── features/       # auth, learning, tutor, progress, assessment, notifications
└── main.dart
```

## Environment Configuration

Set variables in `.env` or your launch configuration:

```env
APP_ENV=development
USE_MOCK_API=true
API_BASE_URL=http://localhost:4000/api/v1
AI_SERVICE_URL=http://localhost:8000/api/v1
```

## Development & Testing

```bash
flutter pub get
flutter run
flutter analyze
flutter test
flutter pub run build_runner build --delete-conflicting-outputs
```

## Build Profiles

Use your standard Flutter build flow for Android or iOS release builds.
