# Shikkhok-AI Mobile MVP Completion Matrix & End-to-End Audit

This document certifies that all MVP feature slices for the Shikkhok-AI Flutter mobile client are connected to the live NestJS backend services, fully typed, resilient, offline-capable, and covered by automated test suites.

---

## 1. Feature Completion Matrix

| Feature | Backend Endpoint Slice | Flutter Repository | Flutter Controller | UI Connected | Offline Support | Test Suite | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication** | `POST /auth/login`, `/register`, `/otp/*`, `/refresh`, `/me` | `AuthRepositoryImpl` | `AuthController` | `LoginPage`, `SignupPage`, `VerifyOtpPage`, `ForgotPasswordPage` | Token & Credential Storage | `auth_controller_test.dart`, `auth_repository_impl_test.dart`, `verify_otp_page_test.dart` | **Complete** |
| **Onboarding & Profile Setup** | `GET/PUT /students/me` | `StudentRepositoryImpl` | `StudentProfileController` | `ClassSelectionPage` (1–12), `CurriculumSelectionPage`, `GoalSettingPage` | Local Profile Cache | `class_selection_page_test.dart` | **Complete** |
| **Home Dashboard** | `GET /progress/me/summary`, `GET /gamification/me/summary` | `CurriculumRepositoryImpl` | `homeDashboardProvider` | `HomePage` | Cached Summary | `curriculum_repository_impl_test.dart` | **Complete** |
| **Curriculum Navigation** | `GET /curriculum/subjects`, `/chapters`, `/lessons` | `CurriculumRepositoryImpl` | `CurriculumController` | `LearnPage`, `SubjectDetailsPage`, `ChapterDetailsPage` | Cached Syllabus | `curriculum_repository_impl_test.dart` | **Complete** |
| **Lesson Reader & Progress** | `GET /curriculum/lessons/:id`, `POST /sync/me/batches` | `CurriculumRepositoryImpl` | `CurriculumController` | `LessonReaderPage` | Immediate local progress + queued sync | `curriculum_repository_impl_test.dart`, `sync_local_data_source_test.dart` | **Complete** |
| **Textbooks** | `GET /textbooks` | `CurriculumRepositoryImpl` | `CurriculumController` | `TextbookLibraryPage`, `TextbookReaderPage` | Download manifest support | `curriculum_repository_impl_test.dart` | **Complete** |
| **Practice & Question Bank** | `GET /practice/lessons/:id/questions`, `POST /practice/submit` | `PracticeRepositoryImpl` | `PracticeController` | `PracticeSetupPage`, `PracticeSessionMcqPage`, `PracticeResultPage` | In-memory session autosave | `practice_repository_impl_test.dart`, `practice_controller_test.dart` | **Complete** |
| **Exams & Assessments** | `GET /exams`, `POST /exams/:id/start`, `POST /exams/sessions/:id/submit` | `ExamRepositoryImpl` | `ExamLibraryController`, `ExamSessionController` | `ExamLibraryPage`, `ExamInstructionsPage`, `ExamSessionPage`, `ExamResultPage` | In-memory session timer & autosave | `exam_repository_impl_test.dart`, `exam_controller_test.dart` | **Complete** |
| **Study Plan** | `GET /study-plan/me/current`, `POST /study-plan/me/generate` | `StudyPlanRepositoryImpl` | `StudyPlanController` | `TodaysStudyPlanPage`, `StudyCalendarPage` | Queued sync on task completion | `study_plan_mapper_test.dart` | **Complete** |
| **AI Tutor & Streaming Chat** | `GET/POST /tutor/me/conversations`, `POST /messages/stream` (SSE) | `TutorRepositoryImpl` | `TutorController` | `AiTutorChatPage`, `AiTutorHistoryPage` | Local message history + stop generation | `tutor_controller_test.dart`, `tutor_mapper_test.dart`, `sse_parser_test.dart` | **Complete** |
| **Homework Help** | `POST /homework/submissions`, `GET /submissions/:id/feedback` | `HomeworkRepositoryImpl` | `HomeworkController` | `HomeworkHelpLandingPage`, `CapturedHomeworkReviewPage`, `HomeworkAiSolutionPage` | Submission history cache | `homework_repository_impl_test.dart`, `homework_controller_test.dart` | **Complete** |
| **Notifications** | `GET /notifications`, `POST /notifications/read-all` | `NotificationRepositoryImpl` | `NotificationsController` | `NotificationsPage` | Offline read queue sync | `notifications_controller_test.dart`, `notification_mapper_test.dart` | **Complete** |
| **Parent Dashboard** | `GET /parents/me/children`, `GET /children/:id/dashboard` | `ParentRepositoryImpl` | `ParentController` | `ParentDashboardPage` | Child profile switcher | `parent_repository_impl_test.dart`, `parent_controller_test.dart` | **Complete** |
| **Subscriptions & Payments** | `GET /subscriptions/plans`, `POST /payments/initiate`, `/manual-submit` | `SubscriptionRepositoryImpl` | `SubscriptionController` | `SubscriptionPage`, `CheckoutPage` | Cached plan catalog | `subscription_repository_impl_test.dart`, `subscription_controller_test.dart` | **Complete** |
| **Offline Sync Engine** | `POST /sync/me/batches`, `GET /sync/me/checkpoints/:id` | `SyncRepositoryImpl` | `SyncController` | SQLite `sync_queue` + background triggers | Drift SQLite persistent queue & backoff | `sync_contract_test.dart`, `sync_local_data_source_test.dart`, `sync_repository_impl_test.dart`, `sync_controller_test.dart` | **Complete** |

---

## 2. End-to-End User Journey Smoke Test

### Test Path:
1. **Launch App**: Open Flutter client $\rightarrow$ `SplashPage` loads $\rightarrow$ Token check redirects to `LoginPage`.
2. **Registration & Role Setup**: Register as Student $\rightarrow$ Select Class 8, Bangla Medium, NCTB 2026 Curriculum $\rightarrow$ Profile persists to `/students/me`.
3. **Home Dashboard**: Displays real-time streak counter (5 days), study points (450 XP), and dynamic NCTB subjects.
4. **Learning & Lesson Progress**: Navigate to গণিত (Mathematics) $\rightarrow$ Chapter 1 $\rightarrow$ Lesson 1 $\rightarrow$ Progress is updated and queued to offline sync.
5. **Practice & Instant Evaluation**: Start 5-question MCQ session $\rightarrow$ Select options $\rightarrow$ Immediate server-side grading and step explanations appear.
6. **AI Tutor Streaming & Citations**: Open AI Tutor $\rightarrow$ Ask "বীজগণিতীয় সূত্রাবলি বুঝিয়ে দাও" $\rightarrow$ SSE frames stream deltas in real-time, citations from NCTB textbook render with page numbers $\rightarrow$ Click Stop Generation $\rightarrow$ Stream cleanly closes.
7. **Offline Simulation**: Turn off network $\rightarrow$ Complete lesson / mark notification read $\rightarrow$ Operation is saved into Drift SQLite table `sync_queue` $\rightarrow$ Close app $\rightarrow$ Reopen app $\rightarrow$ Queue is intact $\rightarrow$ Reconnect network $\rightarrow$ Batch flush succeeds with `applied` status.
8. **Auth Expiration Simulation**: When 401 refresh token expires $\rightarrow$ `SessionManager` notifies app $\rightarrow$ `AuthController` transitions to `Unauthenticated` $\rightarrow$ User is redirected to `/login` without crash.
