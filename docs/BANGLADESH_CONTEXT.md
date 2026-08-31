# Bangladesh Context & EdTech Product Architecture Policy

This document outlines the core architectural and product design principles tailored specifically for Bangladeshi students, low-end Android hardware, variable connectivity, and NCTB curriculum standards.

---

## 1. Bandwidth & Storage Optimization (Low Bandwidth, Limited Storage)

| Challenge in Bangladesh | Architecture Solution |
| :--- | :--- |
| **Low Bandwidth / 2G-3G Networks** | Compact JSON payloads, gzip/brotli HTTP compression, lightweight SVG vector icons instead of heavy PNGs, aggressive HTTP response caching. |
| **Limited Device Storage (<32GB storage)** | Zero heavy mobile binary dependencies. Local database caching (AsyncStorage / SQLite) capped at 50 MB with automatic LRU cache eviction. |
| **Intermittent Connectivity** | Offline progress queue (`OfflineStorageManager`), SSE token streaming resilience, cached lesson reading mode. |

---

## 2. Bangla-First User Experience (UX)

- **Default Language**: App defaults to Bangla (`bn`) across all screens, navigation, feedback, and error messages.
- **Pedagogical Tone**: Encouraging, step-by-step guidance formatted appropriately for Bangladeshi students.
- **Bangla Glyph Line-Height Protection**: Text components use 1.45x line-height scaling (`accessibilityTheme.banglaTypography`) to prevent top/bottom clipping of Bangla diacritics (উ-কার, ই-কার, র-ফলা, ্য-ফলা) on low-end Android webviews.

---

## 3. National Curriculum (NCTB) & Board Exam Alignment

```
                        NCTB Curriculum Taxonomy
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
Primary Level               Junior Secondary & Secondary   Higher Secondary (HSC)
(Class 1 - Class 5)         (Class 6 - Class 10 / SSC)     (Class 11 - Class 12 / HSC)
  - Foundational Literacy     - Science, Math, Bangla,       - Physics, Chemistry, Math,
  - Basic Numeracy              English, ICT                   Biology, Accounting, ICT
                              - SSC Board Preparation        - HSC Board Preparation
```

- **Curriculum Isolation**: Grade-level metadata filter isolation ensures Class 6 students never receive Class 10/12 material unless explicitly requested.
- **Curriculum Versioning**: Database models track `curriculumYear` (e.g. 2026 NCTB curriculum framework).
- **SSC / HSC Readiness**: Architecture supports board exam practice sets, past question papers, and topic-wise mastery tracking tailored for SSC and HSC exams.

---

## 4. Mobile Dependency Budget

To ensure the APK/IPA binary size remains light (<15 MB download size):
- **NO heavy ML/AI runtime engines on client**. All AI calculations run strictly inside `services/ai`.
- **NO bulky UI libraries**. Vanilla styling with design system tokens (`colors.ts`, `spacing.ts`, `typography.ts`).
- **NO unneeded native bridges**. Lightweight native modules only.
