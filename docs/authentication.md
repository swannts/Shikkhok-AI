# Authentication & Authorization Architecture

## 1. Authentication Strategy
- **Tokens**: JWT Access & Refresh token rotation with secure storage.
- **Server Identity**: Backend services verify tokens and attach `req.user` (`userId`, `studentId`, `role`). Identity from request body is untrusted.

## 2. Authorization & IDOR Protection Matrix
- **STUDENT**: Can access ONLY their own progress, practice history, study plan, and AI chat sessions (`verifyRecordOwnership`).
- **PARENT**: Can access ONLY linked children in `linkedStudentIds`.
- **TEACHER**: Can access ONLY assigned classes in `managedClassIds` (`verifyTeacherClassOwnership`).
- **ADMIN**: Global platform management access across isolated `/api/v1/admin` routes (`requireRoles(['ADMIN'])`).
