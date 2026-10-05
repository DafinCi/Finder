# Finder Documentation

This directory documents how Finder is actually built. It is written for long-term
contributors and for coding agents that need to modify the repository without
guessing.

## Source of truth

When documents and code disagree, the code wins. Use this order:

1. Application source code in `src/`
2. Database schema and migrations in `src/database/`
3. Tests that exercise current behavior in `test/`
4. Runtime configuration (`.env.example`, `next.config.mjs`)
5. Zod schemas and TypeScript types
6. `package.json` and the lockfile
7. Official documentation for external technologies
8. This documentation

## Where to start

| If you want to | Read |
| --- | --- |
| Understand the system | [architecture/overview.md](architecture/overview.md) |
| Know who owns which data | [architecture/data-ownership.md](architecture/data-ownership.md) |
| Know what must not break | [architecture/invariants.md](architecture/invariants.md) |
| Understand failure behavior | [architecture/failure-semantics.md](architecture/failure-semantics.md) |
| Understand domain terms | [glossary.md](glossary.md) |
| Work on the AI agent | [ai/overview.md](ai/overview.md) |
| Give context to a coding agent | [ai/agent-context.md](ai/agent-context.md) |
| Call or change an API route | [api/overview.md](api/overview.md) |
| Understand Walrus and MemWal | [integrations/walrus-memwal.md](integrations/walrus-memwal.md) |
| Set up the project | [development/setup.md](development/setup.md) |
| Know what to check when changing code | [development/change-map.md](development/change-map.md) |

## Documentation rules

- One fact has one home. Other documents link to it instead of repeating it.
- External technologies are documented as Finder integrations, not as tutorials.
  Official documentation is linked for concepts and protocol details.
- API depth is tiered: public endpoints get detail, product endpoints get the
  contract, internal endpoints get a brief note.
- Claims must be traceable to code, migrations, or tests.
- Facts, design decisions, limitations, and future work are labelled as such.

## Preserved reference material

`docs/groq/` and `docs/hackathon-rules.md` are local reference material used
during development. They are not part of the permanent documentation set and are
kept out of version control.
