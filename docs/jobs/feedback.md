# Job Feedback

Feedback and telemetry are different signals with different consequences. Keeping
them separate matters, because only one of them is meant to change behavior.

## Saved and rejected jobs

- **Saved** means the user explicitly kept a job. Stored in `saved_jobs`.
- **Rejected** means the user dismissed a job from recommendations. Also stored in
  `saved_jobs`, with a rejected state.
- Both are respected when recommendations are built, so a rejected job does not
  come back on its own.

## Feedback events

Stored in `job_feedback_events`. A negative signal can open a correction flow that
writes a Career Memory, which then influences future answers. This is the path
that lets the agent learn from a mistake.

## Telemetry

Stored in `job_interaction_telemetry`. These are implicit interaction events such
as card clicks and drawer views. Telemetry is for product metrics only. It must
not change recommendations or memory.

## Summary

| Signal | Table | Explicit | Affects memory | Affects recommendations |
| --- | --- | --- | --- | --- |
| Saved job | `saved_jobs` | Yes | No | Yes |
| Rejected job | `saved_jobs` | Yes | No | Yes |
| Feedback | `job_feedback_events` | Yes | Yes, via correction | Indirect |
| Telemetry | `job_interaction_telemetry` | No | No | No |

## Related

- [../api/feedback.md](../api/feedback.md)
- [../ai/memory.md](../ai/memory.md)
