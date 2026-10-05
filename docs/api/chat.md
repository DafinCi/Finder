# Chat API

Chat is the conversational surface and the entry point for the agent. All routes
require a session and are scoped to the caller's own sessions.

## Sessions

| Route | Purpose |
| --- | --- |
| `GET /api/chat/session` | List the caller's chat sessions |
| `POST /api/chat/session` | Create a session |
| `GET /api/chat/session/[id]` | Read a session and its messages |
| `PATCH /api/chat/session/[id]` | Update session fields such as the title |
| `DELETE /api/chat/session/[id]` | Delete a session |

Ownership is checked before any read or write. A session that belongs to another
user is treated as not found.

## Messages

### `POST /api/chat/message`

- **Purpose**: send a user turn and stream the assistant response.
- **Auth**: session.
- **Rate limit**: 12 messages per minute per user.
- **Response**: Server-Sent Events.
- **Side effects**: persists the user message and the assistant message, may
  execute Agent Tools, and may trigger a memory write.
- **Notes**: the agent may emit memory-recall events so the UI can show which
  memories informed the answer.

### `PATCH /api/chat/message/[id]`

- **Purpose**: update a message, currently used for the confirmation form
  attached to a resume review card.
- **Auth**: session, owner-scoped.

## Related

- [../ai/overview.md](../ai/overview.md)
- [../ai/memory.md](../ai/memory.md)
- [../architecture/system-architecture.md](../architecture/system-architecture.md)
