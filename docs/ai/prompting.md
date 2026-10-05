# Prompting

Prompts are implementation artifacts and live in `src/lib/groq/prompts/`. The chat
prompt carries a version constant, currently `v2.7`, exported from the prompt
module.

## Prompt structure

The chat prompt combines, in order:

1. Role and behavior rules for a career copilot.
2. Memory policy: which facts are worth remembering and which are not.
3. Precedence rules that keep canonical profile data above recalled memory.
4. Tool usage rules and confirmation rules.
5. Injected context: profile facts and recalled memory.
6. Recent conversation turns within a token budget.

## Precedence

Canonical Career Profile data outranks Career Memory. When memory and the profile
disagree, the profile wins and the agent should not present the memory as current.
This exists because memory can be stale while the profile is user-confirmed.

## Structured outputs

Structured prompts request JSON, and the response is parsed and validated with Zod
before use. A schema failure fails the operation. Raw output is never logged.

## Untrusted input

Resume text and job descriptions are untrusted content. They are context, not
instructions. Prompts are written so that instructions inside those documents are
not treated as commands.

## Changing prompts

1. Update the prompt module and bump the version constant.
2. Check every consumer that injects context into it.
3. Re-run the AI tests, especially tool calling and memory precedence.
4. Update this document if the contract changed.

## Related

- [../ai/overview.md](../ai/overview.md)
- [../architecture/invariants.md](../architecture/invariants.md)
