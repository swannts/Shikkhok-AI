# Local Development & Setup Guide

## Prerequisites
- Docker & Docker Compose
- Node.js v20+
- Python 3.12+
- Flutter SDK
- `uv`

## Quickstart

```bash
# Start shared infrastructure
docker compose up -d

# Run the NestJS API
cd services/api
npm install
npm run dev

# Run the FastAPI AI service
cd ../ai
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Run the Flutter mobile app
cd ../../apps/mobile
flutter pub get
flutter run

# Run the admin console
cd ../admin
npm install
npm run dev
```

## Verification

```bash
# API tests
cd services/api
npm test

# AI tests
cd ../ai
uv run pytest -q

# Mobile tests
cd ../../apps/mobile
flutter test

# Admin tests
cd ../admin
npm test
```
