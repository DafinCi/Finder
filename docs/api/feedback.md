# Feedback and Telemetry API

## `POST /api/feedback`

- **Purpose**: record a user signal on a recommendation.
- **Auth**: session.
- **Input**: validated by the route schema; invalid payloads return the validation
  detail because it describes the caller's own input.
- **Side effects**: stores a feedback event in `job_feedback_events`. A negative
  signal can open a correction flow that writes a Career Memory.

## `GET /api/feedback`

- **Purpose**: read the caller's feedback events.
- **Auth**: session, owner-scoped.

## `POST /api/telemetry`

- **Purpose**: record interaction events such as card clicks and drawer views.
- **Auth**: session.
- **Input**: a single event or a batch, validated by the route schema.
- **Notes**: telemetry is product metrics only. It is not the same as feedback and
  must not be used to change recommendations.

## Difference that matters

| | Feedback | Telemetry |
| --- | --- | --- |
| User intent | Explicit | Implicit |
| Can affect memory | Yes | No |
| Can affect recommendations | Indirectly, through memory and saved jobs | No |
