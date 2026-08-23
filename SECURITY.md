# Security Policy

## Reporting Vulnerabilities

If you discover a potential security vulnerability within **Shikkhok AI**, please report it immediately to security@shikkhok.ai. Please do not publish security issues publicly on GitHub before they have been evaluated and addressed by our team.

## Security Practices & Standards
- **Secret Redaction**: Passwords, OTPs, tokens, and API keys are automatically redacted by `StructuredLogger` and zero secrets are hard-coded in source code or Docker compose files.
- **Authorization & IDOR Protection**: Role-Based Access Control (RBAC) and record ownership checks (`verifyRecordOwnership`, `verifyTeacherClassOwnership`) enforce student data isolation.
- **AI Safety & Moderation**: Prompt injection resistance, input/output moderation, Bangladeshi PII redaction, and untrusted RAG context boundaries are active in `services/ai-gateway`.
- **Dependency & Container Scanning**: Docker Compose configs and npm package vulnerabilities are scanned as part of our GitHub Actions CI pipeline (`ci.yml`).
