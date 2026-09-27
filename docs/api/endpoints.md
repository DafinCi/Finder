# API Reference

All API routes are served under `/api` and adhere to standard REST and Server-Sent Events (SSE) conventions.

## Summary Table

| Method   | Endpoint                 | Description                                               | Auth Required       | Rate Limit          |
| :------- | :----------------------- | :-------------------------------------------------------- | :------------------ | :------------------ |
| `POST`   | `/api/auth/signin`       | Sign in with email and password                           | No                  | None                |
| `POST`   | `/api/auth/signup`       | Register a new user with email and password               | No                  | None                |
| `GET`    | `/api/auth/confirm`      | Supabase email OTP confirmation callback                  | No                  | None                |
| `GET`    | `/api/auth/sui/nonce`    | Generate a SIWS challenge nonce                           | No                  | 30 req/min per IP   |
| `POST`   | `/api/auth/sui/verify`   | Verify SIWS signature and issue Supabase session          | No                  | 15 req/min per IP   |
| `POST`   | `/api/auth/sui/link`     | Link a Sui wallet to the current authenticated account    | Yes (Bearer/Cookie) | 15 req/min per IP   |
| `POST`   | `/api/auth/sui/unlink`   | Unlink a Sui wallet from the current account              | Yes (Bearer/Cookie) | None                |
| `POST`   | `/api/upload-resume`     | Upload a PDF resume and extract raw text                  | Yes (Bearer/Cookie) | 6 req/min per user  |
| `POST`   | `/api/analyze`           | Trigger profile extraction and job matching workflow      | Yes (Bearer/Cookie) | 5 req/min per user  |
| `POST`   | `/api/chat/message`      | Send message and receive streaming SSE response           | Yes (Bearer/Cookie) | 12 req/min per user |
| `GET`    | `/api/chat/session`      | List all chat sessions for the authenticated user         | Yes (Bearer/Cookie) | None                |
| `POST`   | `/api/chat/session`      | Create a new chat session (with optional initial message) | Yes (Bearer/Cookie) | None                |
| `GET`    | `/api/chat/session/[id]` | Get session details and full message history              | Yes (Bearer/Cookie) | None                |
| `PATCH`  | `/api/chat/session/[id]` | Rename a chat session title                               | Yes (Bearer/Cookie) | None                |
| `DELETE` | `/api/chat/session/[id]` | Delete a chat session and associated messages             | Yes (Bearer/Cookie) | None                |
| `POST`   | `/api/jobs/sync`         | Trigger external job ingestion from Remotive              | Secret Header       | None                |

---

## 1. Authentication Endpoints

### `POST /api/auth/signin`

Authenticate using standard email and password credentials.

- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "secretPassword123"
  }
  ```
- **Responses**:
  - `200 OK`: Sets HTTP-only Supabase session cookies and returns `{ "success": true, "user": {...} }`.
  - `400 Bad Request`: Missing fields or `SYNTHETIC_EMAIL_NOT_PERMITTED` if an internal synthetic wallet address (`sui_<address>@internal.finder.local`) is used.

---

### `POST /api/auth/signup`

Register a new account. Creates an entry in `auth.users` and automatically triggers a new row in `public.profiles`.

- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "secretPassword123"
  }
  ```
- **Responses**:
  - `201 Created`: Returns `{ "success": true, "user": {...} }`.
  - `400 Bad Request`: Invalid input or synthetic wallet email rejected.

---

### `GET /api/auth/sui/nonce`

Generate a cryptographically secure 256-bit challenge nonce for Sign-In with Sui (SIWS).

- **Query Parameters**:
  - `purpose` (optional): `"SIWS_LOGIN"` (default) or `"SIWS_LINK"`.
- **Response**:
  - `200 OK`: Sets `sui-siws-nonce` HTTP-only cookie (TTL: 300s) and returns:
    ```json
    {
      "success": true,
      "nonce": "e4f8a9b7...",
      "purpose": "SIWS_LOGIN",
      "network": "testnet",
      "issuedAt": "2026-09-27T10:00:00.000Z",
      "expiresAt": "2026-09-27T10:05:00.000Z"
    }
    ```
  - `429 Too Many Requests`: Rate limit exceeded.

---

### `POST /api/auth/sui/verify`

Verify a personal message signed by a Sui wallet, establish or create the user identity, and issue Supabase SSR session cookies.

- **Request Body**:
  ```json
  {
    "message": "localhost:3000 wants you to sign in with your Sui account:\n0x123...",
    "signature": "AA..."
  }
  ```
- **Response**:
  - `200 OK`: Returns authenticated user info and establishes Supabase cookies:
    ```json
    {
      "success": true,
      "user": { "id": "uuid", "email": "sui_0x123...@internal.finder.local" },
      "wallet": "0x123...",
      "isNewUser": false
    }
    ```
  - `400 Bad Request`: Invalid signature, expired nonce, or network mismatch.

---

### `POST /api/auth/sui/link`

Link a Sui wallet to the currently logged-in account. Requires an active Supabase session.

- **Request Body**: Same as verify (`{ "message": "...", "signature": "..." }`) with `purpose: "SIWS_LINK"`.
- **Response**:
  - `200 OK`: Returns `{ "success": true, "wallet": "0x123..." }`.
  - `409 Conflict`: Returned if the wallet is already linked to another account.

---

### `POST /api/auth/sui/unlink`

Unlink the currently linked Sui wallet from the active user's profile.

- **Response**:
  - `200 OK`: Returns `{ "success": true }`.
  - `400 Bad Request`: Blocked if the user is a Web3-only synthetic account without password credentials.

---

## 2. Resume & Analysis Endpoints

### `POST /api/upload-resume`

Upload a resume PDF, validate magic bytes, extract raw text via `pdf-parse`, upload to Supabase Storage, and save record in `public.resumes`.

- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `file`: PDF binary (max 5 MB).
  - `sessionId` (optional): UUID of an existing chat session to link.
  - `prompt` (optional): Optional user message to associate with the attachment.
- **Response**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "File uploaded and text extracted",
      "resumeId": "uuid",
      "fileName": "resume.pdf"
    }
    ```
  - `400 Bad Request`: Non-PDF format, file size > 5 MB, or corrupted/scanned PDF (< 50 chars).

---

### `POST /api/analyze`

Trigger the end-to-end analysis and matching pipeline for an uploaded resume.

- **Request Body**:
  ```json
  {
    "resumeId": "uuid",
    "sessionId": "uuid"
  }
  ```
- **Response**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "analysisId": "uuid",
      "analysis": {
        "candidate": { "name": "...", "title": "...", "skills": { "core": [...] } },
        "career": { "career_level": "Mid-Level", "strengths": [...] }
      },
      "jobMatches": [
        {
          "id": "uuid",
          "job_id": "uuid",
          "match_score": 88,
          "title": "Frontend Engineer",
          "company": "Acme Corp",
          "reason": "Strong match with React and TypeScript..."
        }
      ]
    }
    ```
  - `409 Conflict`: Analysis is already running for this resume.

---

## 3. Chat & Copilot Endpoints

### `POST /api/chat/message`

Send a user message in a chat session and stream back the assistant response using Server-Sent Events (SSE).

- **Request Body**:
  ```json
  {
    "session_id": "uuid",
    "content": "What technical questions should I prepare for this role?"
  }
  ```
- **Response**:
  - Stream `Content-Type: text/event-stream; charset=utf-8`
  - Event Chunks:

    ```
    data: {"token": "Based"}

    data: {"token": " on"}

    data: {"token": " your"}

    data: {"done": true, "userMessage": {...}, "assistantMessage": {...}}
    ```

  - `429 Too Many Requests`: Triggered if exceeding 12 messages / minute.

---

### `GET /api/chat/session`

List all chat sessions belonging to the authenticated user, ordered by `updated_at DESC`.

- **Response**:
  ```json
  {
    "sessions": [
      {
        "id": "uuid",
        "title": "CV analysis: Senior Frontend Engineer",
        "resume_id": "uuid",
        "created_at": "2026-09-27T10:00:00Z",
        "updated_at": "2026-09-27T10:05:00Z"
      }
    ]
  }
  ```

---

### `GET /api/chat/session/[id]`

Retrieve details for a single session, including chronological message history.

---

### `PATCH /api/chat/session/[id]`

Rename the title of a chat session.

- **Request Body**: `{ "title": "New Title (max 100 chars)" }`
- **Response**: `{ "success": true, "session": {...} }`

---

### `DELETE /api/chat/session/[id]`

Delete a chat session and cascade-delete all contained messages.

- **Response**: `{ "success": true }`

---

## 4. Job Ingestion Endpoint

### `POST /api/jobs/sync`

Synchronize remote job listings from Remotive API into `public.companies` and `public.jobs`.

- **Authentication**:
  - Requires `Authorization: Bearer <CRON_SECRET>` or header `x-sync-secret: <CRON_SECRET>`.
  - In local development (`NODE_ENV=development`), bypass is permitted if no secret is configured.
- **Response**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "Job ingestion completed successfully",
      "count": 25,
      "source": "remotive",
      "durationMs": 1420
    }
    ```
  - `401 Unauthorized`: Invalid or missing secret header.
