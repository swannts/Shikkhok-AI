# Local Development & Setup Guide

## Prerequisites
- Node.js v18+ / v20+
- Docker & Docker Compose
- npm

## 1. Quickstart via Docker Compose

```bash
# Clone environment template
cp .env.example .env

# Launch entire microservice stack (Postgres, Redis, API, AI Gateway, Worker)
docker compose up -d

# Verify container health
docker compose ps
```

## 2. Running Services Individually

```bash
# API Service (Port 4000)
cd services/api
npm install
npx prisma generate
npm run dev

# AI Gateway Service (Port 4001)
cd services/ai-gateway
npm install
npm run dev

# Mobile App (React Native / Expo)
cd apps/mobile
npm install
npm start
```
