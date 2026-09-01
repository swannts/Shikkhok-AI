# Admin Control Center Gap Matrix

This matrix is based on the current repository implementation. A capability is marked implemented only when a real API or UI path exists; dashboards and navigation must not imply functionality that is not wired.

| Capability | Current backend | Current frontend | Missing backend | Missing frontend | Priority |
| --- | --- | --- | --- | --- | --- |
| Operational dashboard | `GET /api/v1/admin/metrics/overview` with live Mongo aggregations | Dashboard KPI cards and action links | Learning/operations/queue aggregates | More KPI breakdowns and incident queue | P0 |
| User management | Admin user listing and audited status mutation | Users list, search, role/status filters, status action | Ownership-safe session reset, parent links, student detail aggregation | Dedicated students/parents/admin pages | P1 |
| Curriculum CRUD | Subject/chapter/lesson creation and audited lesson publish | Curriculum management page | DRAFT/REVIEW/APPROVED/PUBLISHED workflow, reviewers, version history | Review queue, completeness matrix, version pages | P0 |
| Textbooks and offline content | Textbook and manifest modules exist for application clients | No dedicated admin page | Admin ingestion lifecycle, retry/cancel/log APIs | Textbook detail, preview, package/index status | P0 |
| AI operations | AI health, ingestion, vector stats, book-index deletion | AI telemetry page and ingestion controls | Protected reindex/retrieval test/evaluation/review APIs | Quality dashboard, review queue, evaluation center | P0 |
| Payments | Pending manual payments, approve/reject, audited mutations | Payments page | Reconciliation/refund/history APIs | Revenue, reconciliation, subscription operations | P1 |
| Audit | Audited admin mutations and paginated audit query | Audit log page | Permission-scoped audit access and session events | Security/session administration | P0 |
| Authentication and authorization | JWT + admin role guard (`admin`) | Admin sign-in and route guard | Granular permissions, admin sessions, logout-all, MFA/TOTP contracts | MFA/session UI | P0 |
| Classrooms and realtime | Classroom/live classroom services exist | No admin operations UI | Safe force-end/lock/remove admin actions and audit contracts | Classroom, room, moderation pages | P1 |
| Assessments and homework | Student-facing exam, practice, homework modules | No admin operations UI | Admin question workflow and analytics APIs | Question bank, practice, exam, homework pages | P1 |
| Communications and support | Notifications and device-token APIs | No admin operations UI | Campaign/support/report workflows | Notifications, tickets, reports pages | P2 |
| Platform health | Service health endpoints and Prometheus metrics exist | No operations page | Aggregated worker/queue/Qdrant health API | System health, workers, queues, realtime pages | P0 |

## Safe Delivery Order

1. Add backend permission claims and authorization decorators without weakening the existing admin guard.
2. Add curriculum and AI review state machines with audited transitions.
3. Add operational health/queue aggregation and connect the existing dashboard to it.
4. Add student, teacher, classroom, payment reconciliation, and support vertical slices with tests before exposing navigation.
5. Add MFA/session administration for privileged roles, then expose those controls in the UI.
