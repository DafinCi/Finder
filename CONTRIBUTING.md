# Contributing to Finder

Thank you for your interest in contributing to Finder!

Finder is an open-source AI Career Intelligence Platform and Job Portal built with Next.js 16, Supabase, Groq Cloud, and Sui blockchain Web3 authentication.

---

## Code of Conduct

All contributors and maintainers are expected to follow our [**Code of Conduct**](CODE_OF_CONDUCT.md).

---

## Development Workflow

### 1. Branch Strategy

- The primary development branch is **`develop`**.
- Stable production releases reside on **`main`**.
- Always branch your work from **`develop`**:

```bash
git checkout develop
git pull origin develop
git checkout -b feat/your-feature-name
```

### 2. Branch Naming Conventions

Use one of the following prefixes for branch names:

| Prefix      | Purpose                                   | Example                      |
| :---------- | :---------------------------------------- | :--------------------------- |
| `feat/`     | New user-facing feature or enhancement    | `feat/job-card-bookmark`     |
| `fix/`      | Bug fix                                   | `fix/pdf-magic-bytes-check`  |
| `refactor/` | Code refactoring without behavior changes | `refactor/sui-nonce-manager` |
| `test/`     | Adding or updating unit/integration tests | `test/prompt-boundary-unit`  |
| `docs/`     | Documentation improvements                | `docs/api-reference-update`  |
| `chore/`    | Tooling, dependencies, or config updates  | `chore/upgrade-vitest`       |

---

## Quality Gates Checklist

Before committing or opening a Pull Request, your changes **must** pass all static and hermetic automated checks locally:

```bash
# 1. ESLint Code Quality
npm run lint

# 2. TypeScript Static Typecheck
npx tsc --noEmit

# 3. Hermetic Unit Tests (120 tests)
npm run test:unit

# 4. Hermetic Mocked Integration Tests (53 tests)
npm run test:integration:mocked

# 5. Production Build Verification
npm run build
```

These exact gates are run automatically by GitHub Actions on every Pull Request.

---

## Coding Standards

### 1. TypeScript Strictness

- All source code must be written in TypeScript (`.ts` or `.tsx`).
- Do not use `any` unless strictly wrapping legacy untyped modules.
- Ensure all external data payloads (API requests, LLM outputs, job feeds) are validated with Zod schemas.

### 2. Feature-Based Architecture

Application code is organized into self-contained feature slices under `src/features/`:

- `ai-analysis/`: Resume parsing, candidate extraction, and job match orchestration.
- `auth/`: User authentication forms, session state, and auth providers.
- `chat/`: Real-time chat timeline, prompt omnibar, and SSE stream consumer.
- `jobs/`: Job discovery view, filter toolbar, detail drawer, and ingestion client.
- `sui/`: Web3 wallet connection, SIWS verification, and account linking cards.

Shared infrastructure code resides in:

- `src/lib/`: Database clients (`supabase/`), AI clients (`groq/`), Web3 utilities (`sui/`), rate limiters.
- `src/components/`: Reusable UI components, application shell, and theme providers.
- `src/types/`: Global domain interfaces.

### 3. Separation of Concerns

- **Components** (`components/`): Pure UI rendering and event dispatch. Never call database or AI APIs directly inside React components.
- **Hooks** (`hooks/`): Client-side state, lifecycle management, and UI reactivity.
- **Services** (`services/`): Business logic, API calls, data transformation, and domain algorithms.

---

## Commit Message Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```text
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### Examples:

- `feat(matching): add fallback scoring formula for Groq rate limits`
- `fix(auth): prevent synthetic wallet email from password login`
- `docs(api): document all 13 route handlers with schemas`
- `test(unit): add prompt boundary injection tests`

---

## Opening a Pull Request

1. Push your branch to GitHub:
   ```bash
   git push origin feat/your-feature-name
   ```
2. Open a Pull Request targeting the **`develop`** branch.
3. Complete the PR template checklist:
   - Provide a clear summary of what changed and why.
   - Attach screenshots if you modified user-facing UI.
   - Link related issues (e.g. `Closes #42`).
4. Ensure all GitHub Actions status checks pass.

Thank you for helping make Finder better!
