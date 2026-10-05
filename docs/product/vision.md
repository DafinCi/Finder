# Vision

## The problem

Job boards are keyword search engines. Candidates guess the words a recruiter
used, get no explanation for why a role fits or does not fit, and lose context
between sessions because nothing remembers them.

## What Finder is

Finder turns a resume into a structured Career Profile, matches that profile
against real job listings with a deterministic score, and keeps a conversational
agent that remembers durable career facts across sessions. When the agent
recommends something, it shows the score and the gap behind it.

## Mission

Make job search a guided career conversation instead of a keyword lottery, while
keeping the user's data under their control.

## Principles

**Understanding before recommendation.** A recommendation is only useful if the
system understands the candidate first. Finder extracts skills, seniority, and
target roles before it scores anything.

**Explain every recommendation.** Each match shows a score and a rationale. The
score is deterministic and reproducible, not a number the model invented.

**Resilience over fragility.** When a model provider is rate limited or
unavailable, Finder falls back rather than failing, and matching correctness does
not depend on the model being up.

**Memory with honest boundaries.** The agent remembers what matters and surfaces
when memory informed an answer. Memory never overrides confirmed profile data, and
the product never claims durability that has not been confirmed.

**Data the user can reason about.** Resumes stay private. The only thing published
publicly is a minimized passport the user explicitly confirms, and it contains no
identity, contact, education, employer, salary, or location data.

## What Finder is not

- Not a resume database that sells candidate data.
- Not a system where an LLM decides who you are or how you score.
- Not a promise of permanent deletion on immutable storage.
- Not a replacement for reading a job listing before applying.

## Related

- [roadmap.md](roadmap.md)
- [../architecture/overview.md](../architecture/overview.md)
- [../architecture/invariants.md](../architecture/invariants.md)
