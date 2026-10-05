# Agent Tools

Tools are typed operations the agent may request. Definitions live in
`src/features/agent/tools/agent-tool.definitions.ts` and execution lives in
`src/features/agent/services/agent-tool-dispatcher.service.ts`.

## Tool list

| Tool | Kind | Purpose |
| --- | --- | --- |
| `get_career_recommendations` | Read | Return scored job recommendations |
| `inspect_job_details` | Read | Fetch full detail for one job |
| `read_candidate_cv` | Read | Read the caller's resume text |
| `save_job` | Write | Mark a job as saved |
| `reject_job` | Write | Dismiss a job from recommendations |
| `remember_fact` | Write | Store a durable Career Memory |
| `propose_preference_update` | Write | Propose a change to career preferences |

## Execution rules

- Every tool runs server-side. The model never runs code, SQL, or network calls
  directly.
- Arguments are validated with a schema before execution. Invalid arguments return
  a structured failure.
- Tools act on the authenticated identity only. A tool cannot be told to act for
  another user.
- A write tool reports success only after the backend confirms the write. If the
  write fails, the tool reports failure and the agent must not claim success.
- Read tools never expose another user's data.

## Permissions

Tools are deliberately narrow. There is no general-purpose database or HTTP tool,
because that would let a model reach state the product does not intend to expose.

## Adding a tool

1. Add the definition and a Zod schema for its arguments.
2. Add a handler in the dispatcher and keep it owner-scoped.
3. Decide the success semantics before writing user-facing confirmation.
4. Update this document and add a test.

## Related

- [agent.md](agent.md)
- [../architecture/invariants.md](../architecture/invariants.md) I4
