# Resume and Analysis API

## `POST /api/upload-resume`

- **Purpose**: accept a resume PDF and start the processing pipeline.
- **Auth**: session.
- **Rate limit**: 6 uploads per minute per user.
- **Input**: multipart form data with a `file` field, plus an optional chat
  `sessionId` and `prompt` when the upload starts from chat.
- **Validation**: content type must be `application/pdf`, size must be 5 MB or
  less, and the file signature must start with `%PDF`. A non-resume document is
  rejected with `NOT_A_RESUME` after the heuristic check.
- **Side effects**: stores the file in the private `resumes` bucket, inserts a
  `resumes` row, creates `resume_processing` state, extracts text, and advances
  the pipeline stage.
- **Ownership**: a `sessionId` is accepted only when the session belongs to the
  caller.

## `POST /api/analyze`

- **Purpose**: run the analysis workflow for an uploaded resume.
- **Auth**: session.
- **Rate limit**: yes.
- **Input**: resume reference; validated by the route schema.
- **Side effects**: profile extraction, document classification, matching, and
  `PATCH`s to the draft Career Profile. Analysis is guarded so one resume is not
  analyzed twice concurrently.
- **Notes**: the route supports an explicit override when the user insists a
  flagged document is a resume, and a reject decision removes the stored content.

## `GET /api/analyze/status`

- **Purpose**: report the current pipeline stage for a resume.
- **Auth**: session.
- **Query**: `resumeId`.
- **Output**: stage and any classification metadata the UI needs.
- **Why it exists**: the UI must show real progress instead of assuming the work
  finished.

## Status semantics

Pipeline stages are `received`, `text_extracted`, `heuristic_checked`, `stored`,
with terminal outcomes `needs_review`, `rejected`, and `failed`. Only a `stored`
or completed state means the resume was accepted. See
[../architecture/failure-semantics.md](../architecture/failure-semantics.md).
