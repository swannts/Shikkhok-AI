# Shikkhok AI Mobile Application

Personalized AI-powered learning app for Bangladesh students (Class 1–12) built with **React Native**, **Expo**, **TypeScript**, **Expo Router**, **TanStack Query**, and **Zustand**.

---

## 🏛️ Architecture Highlights

- **File-Based Routing**: Clean directory tree under `src/app/` utilizing Expo Router layout groups (`(auth)`, `(onboarding)`, `(tabs)`, `subject/`, `lesson/`, `practice/`, `exam/`, `homework/`, `study-plan/`).
- **Session Guards & SecureStore Restoration**: Automatic authentication & onboarding status restoration from `tokenStorage` on application startup (`src/app/_layout.tsx`).
- **Domain Feature Separation**: Business logic and UI components isolated in feature modules (`src/features/`).
- **Mock vs API Repositories**: Seamless zero-code switching between local mock data and real backend HTTP/streaming API endpoints via `EXPO_PUBLIC_USE_MOCK_API`.
- **Typed HTTP Infrastructure**: `httpClient` with token resolution, combined cancellation/timeout handling, SSE stream parsing, and distinct `REQUEST_ABORTED` vs `REQUEST_TIMEOUT` error codes.
- **Dynamic Assessment Evaluation**: Real option-checking and mastery update calculations in `practiceRepository` using query cache by `sessionId`.

---

## 📜 Route Tree (`src/app/`)

```text
src/app/
├── _layout.tsx (Root Stack, QueryProvider & Session Guard)
├── index.tsx (Initial session redirect)
├── +not-found.tsx
├── (auth)/
│   ├── login.tsx
│   ├── signup.tsx
│   └── verify-otp.tsx
├── (onboarding)/
│   └── index.tsx (3-step setup flow)
├── (tabs)/
│   ├── index.tsx (Home)
│   ├── learn.tsx (Curriculum)
│   ├── tutor.tsx (AI Tutor Chat)
│   ├── progress.tsx (Mastery Dashboard)
│   └── profile.tsx (Settings & Language Switcher)
├── subject/[subjectId].tsx
├── lesson/[lessonId].tsx
├── practice/
│   ├── index.tsx
│   └── result.tsx
├── exam/[examId].tsx
├── homework/index.tsx
└── study-plan/index.tsx
```

---

## ⚙️ Environment Configuration

Set variables in `.env` or `eas.json`:

```env
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_USE_MOCK_API=true
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
EXPO_PUBLIC_AI_GATEWAY_URL=http://localhost:4001/ai/v1
```

---

## 🧪 Development & Testing Scripts

```bash
# Start Metro Dev Server
npm start

# TypeScript Type Check
npm run typecheck

# ESLint Check & Fix
npm run lint
npm run lint:fix

# Prettier Format & Check
npm run format
npm run format:check

# Run Jest Unit Tests
npm test
```

---

## 📦 EAS Build Profiles

```bash
# Development Build
eas build --profile development --platform android

# Staging Preview Build
eas build --profile preview --platform android

# Production Build
eas build --profile production --platform android
```
