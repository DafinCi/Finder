# Security Policy

## Reporting Security Vulnerabilities

The Finder development team takes the security of our application, user data, and smart contract integrations seriously.

If you believe you have discovered a security vulnerability in Finder, please report it responsibly by contacting the maintainers directly.

**Do NOT report security vulnerabilities via public GitHub Issues, Pull Requests, or Discussions.**

### Reporting Process

1. Email your report to the repository maintainers or use GitHub's private vulnerability reporting feature:
   - GitHub: [Security Advisories](https://github.com/DafinCi/Finder/security/advisories/new)
2. Please include:
   - A clear description of the vulnerability.
   - Exact steps, scripts, or payloads required to reproduce the issue.
   - The potential impact and attack vector (e.g., privilege escalation, secret leak, replay attack).
   - Any suggested remediations or mitigations.
3. You will receive an acknowledgment within 48 hours.
4. We ask that you maintain confidentiality until we have investigated, addressed, and released a fix.

---

## Security Model & Safeguards

Finder incorporates multiple layers of security to protect user sessions, candidate data, and API resources:

### 1. Dual-Tier Authentication Architecture

- **Supabase Auth & Session Cookies**: Sessions are issued and managed via `@supabase/ssr` using HTTP-only, secure, `SameSite=lax` cookies. Client-side JavaScript cannot read or tamper with session tokens.
- **Sign-In with Sui (SIWS)**:
  - Cryptographic challenge-response authentication using `@mysten/sui/verify`.
  - Nonces are 256-bit cryptographically secure random bytes with a strict 5-minute TTL.
  - Nonces are bound to client cookies (`sui-siws-nonce`) and invalidated immediately upon first consumption to prevent replay attacks.
  - Web3-only users are assigned synthetic internal identity domains (`sui_<address>@internal.finder.local`). The application explicitly blocks password sign-up and sign-in attempts using this synthetic domain.

### 2. Database & Row Level Security (RLS)

- **PostgreSQL Row Level Security**: RLS is strictly enabled on all application tables (`profiles`, `resumes`, `resume_analysis`, `companies`, `jobs`, `job_matches`, `chat_sessions`, `chat_messages`).
- **Tenant Isolation**: Users can only read and mutate documents, analyses, chat sessions, and job recommendations associated with their authenticated `auth.uid()`.
- **Service Role Key Isolation**: The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and is strictly confined to server-side route handlers and backend services. It is **never** prefixed with `NEXT_PUBLIC_` and never bundled into client-side assets.

### 3. File Upload & Document Sanitization

- **Magic Bytes Validation**: Resume uploads (`/api/upload-resume`) strictly verify PDF magic bytes (`%PDF-` / `0x25 0x50 0x44 0x46`) rather than trusting the client-supplied MIME type or file extension.
- **File Size & Character Limits**: Hard limit of 5 MB per document. Extracted text is capped at 15,000 characters to prevent resource exhaustion and buffer overflows.
- **HTML Sanitization**: Job descriptions and user-generated Markdown are processed through sanitize utilities and `rehype-raw` with explicit sanitization schemas to prevent Cross-Site Scripting (XSS).

### 4. Rate Limiting & Denial-of-Service Defense

- **In-Memory Rate Limiting**: All sensitive endpoints are protected by rate limiters:
  - `POST /api/chat/message`: 12 requests / minute per user.
  - `POST /api/analyze`: 5 requests / minute per user.
  - `POST /api/upload-resume`: 6 uploads / minute per user.
  - `GET /api/auth/sui/nonce`: 30 requests / minute per IP.
  - `POST /api/auth/sui/verify`: 15 requests / minute per IP.
- **Cron Route Protection**: The job ingestion endpoint (`/api/jobs/sync`) is secured with timing-safe constant-time secret comparison (`crypto.timingSafeEqual`) against `CRON_SECRET` to prevent timing side-channel attacks.

---

## Supported Versions

| Version                  | Supported          |
| :----------------------- | :----------------- |
| `0.1.x` (develop / main) | :white_check_mark: |
| Older releases           | :x:                |
