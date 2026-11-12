## Public QR reporting and private Komite Mutu workflow

The existing prototype opened its dashboard to every visitor and stored reports and simulated roles in localStorage. This change sends `/` and QR links directly to `/lapor`, accepts anonymous reports through a PostgreSQL-backed API, and restricts report data and exports to server-authenticated `komite_mutu` accounts with password + TOTP MFA.

- Add a mobile four-step public form, memory-only draft autosave, idempotent submission, server-generated report numbers, safe receipts and limited tracking-code status lookup.
- Add additive PostgreSQL migrations/RLS, AES-GCM encryption, scrypt password hashes, expiring/revocable HttpOnly sessions, CSRF/Origin checks, database rate limits, private re-encoded photo storage and append-only audit records.
- Add committee review, authorized corrections with encrypted original history, manual grading, RCA/Five Whys/fishbone, CAPA, notifications, filtered charts/drill-down/heatmap, genuine PDF/Excel exports, unit management and downloadable PNG/SVG QR posters.
- Preserve the indicator catalogue and existing browser data. Legacy import is explicit, transactional and append-only; signed encrypted backups restore into a separate database without overwriting different records.

Validation: 41 existing unit tests, 19 API/PostgreSQL integration tests and 11 Chromium E2E tests pass; frontend/backend TypeScript and production build pass. Production dependency audit: zero vulnerabilities. Browser tests use the real API and an isolated PostgreSQL WASM engine with synthetic data; no API mock or production credentials. Coverage includes anonymous 401, non-committee/technical-role 403, MFA and session replay, CSRF, full review/closure validation, RLS, QR decoding, exports, backup recovery and network-failure retries.

Deployment requires a dedicated PostgreSQL instance, server-only environment variables and encryption key, additive migration, least-privilege runtime role and institutional MFA account enrollment. Remote PostgreSQL TLS/driver, Vercel routing and physical QR scans still require staging validation. Attachments remain disabled by default pending hospital policy. No production deployment, real-data migration or deletion was performed.

See [deployment](deployment.md), [migration/recovery](migration-recovery.md), [security checklist](security-checklist.md) and [source audit/file summary](upgrade-audit.md).
