# Chat Commands

Chat commands let a user act on the product directly from the composer. They are
deterministic: a command is parsed on the server before the model runs, so the
model never decides whether a command happened.

## Why this exists

Memory writes through the agent depend on the model choosing to call a tool. That
works, but it is probabilistic. A command gives a guaranteed path: type it, and the
write happens.

## Available commands

| Command | Usage | What it does |
| --- | --- | --- |
| `/remember` | `/remember [category] <fact>` | Writes a Career Memory |
| `/help` | `/help` | Lists the available commands |

The list lives in `src/features/chat/commands/chat-commands.ts`. That registry is
the single source of truth: the server allowlist and the composer palette both
read it, so they cannot drift apart.

## Parsing rules

`parseChatCommand()` in `src/features/chat/commands/parse-chat-command.ts` is a
pure function with no I/O.

- Text that does not start with `/` is not a command.
- A leading `/` whose first token is not in the registry is treated as a normal
  message and reaches the agent. This is deliberate, so a message such as
  `/jobs page is broken` is not hijacked.
- `/help` takes no arguments.
- `/remember` requires a fact between 3 and 500 characters.

## Category inference

`/remember <fact>` infers a category from a documented keyword map, checked in
this order: user_correction, constraint_avoid, work_preference, tech_focus,
role_transition, career_goal, with `career_goal` as the fallback.

`/remember <category> <fact>` skips inference. The confirmation shows which
category was used and marks inferred ones, so the user can resend with an explicit
category.

## Server behaviour

The command branch runs in `POST /api/chat/message`, after the user message is
persisted and before any agent work.

- The model is never called for a known command.
- A successful `/remember` calls `careerMemoryService.rememberFact()`, the same
  service the `remember_fact` tool uses. There is exactly one memory write path.
- The route emits SSE events: `{ token }` with the confirmation text,
  `{ type: "chat_command", command }` with structured data, and `memory_updated`
  when a write succeeded.
- The assistant message stores `metadata.chat_command`, mirroring the
  `action_proposal` pattern.
- The client invalidates the memory feed after `chat_command`, so the card status
  moves from pending to stored without an extra request.

## Rate limits

Commands use a separate bucket, `chat-command:<userId>`, at 30 per minute. The
general chat limiter still runs first, so a burst is also bounded by the chat
limit of 12 per minute.

## Failure behaviour

| Case | Result |
| --- | --- |
| Missing fact, too short, or too long | Confirmation text explains it; no memory is written and no success is claimed |
| Unknown command | Treated as a normal message |
| Memory write throws | "I could not save that to memory just now." No success toast |

## Adding a command

1. Add the definition to the registry.
2. Handle it in the parser, keeping the function pure.
3. Add the route behaviour if it performs a write.
4. Add or extend the timeline card if it returns structured data.
5. Add tests: a parser unit test, and a mocked route test asserting the model is
   not called.
6. Update this document.

## Invariants

- A known command never reaches the model.
- Identity comes from the session, never from the command text.
- The command and the agent tool share one write path.
- Success is claimed only after the database write, and Walrus status is shown
  truthfully.

## Related

- [../api/chat.md](../api/chat.md)
- [agent.md](agent.md)
- [tools.md](tools.md)
- [memory.md](memory.md)
