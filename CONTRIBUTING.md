# Contributing to Finder

Thank you for your interest in contributing to Finder.

Finder is an open-source AI Career Intelligence Platform that helps people understand their professional profile, identify skill gaps, and discover career opportunities through AI-powered resume analysis.

We welcome contributions of all sizes, including:

- Bug fixes
- New features
- UI/UX improvements
- Performance optimization
- Documentation
- Accessibility improvements
- Refactoring
- Tests

---

# Before You Start

Please make sure you have:

- Node.js 22+
- npm
- Git
- Supabase project
- Required environment variables

Install dependencies

```bash
npm install
```

Run development server

```bash
npm run dev
```

---

# Development Workflow

Please follow this workflow for every contribution.

1. Fork the repository (if you're not a core contributor).

2. Create a new branch from `main`.

Example:

```bash
git checkout -b feat/profile-redesign
```

3. Make your changes.

4. Commit using Conventional Commits.

5. Push your branch.

6. Open a Pull Request.

---

# Branch Naming

Use one of these prefixes.

```
feat/
fix/
docs/
refactor/
style/
test/
perf/
chore/
```

Examples

```
feat/workspace-page

feat/job-matching

fix/upload-error

docs/update-readme

refactor/profile-service
```

---

# Commit Convention

We follow Conventional Commits.

Examples

```text
feat(profile): add career summary card

fix(upload): prevent duplicate uploads

docs(readme): update installation guide

refactor(ai): simplify recommendation service
```

Avoid commits like:

```
update

fix bug

final

done

asdf
```

---

# Pull Request Guidelines

Before opening a Pull Request, please ensure:

- The project builds successfully
- No console errors
- Code follows project conventions
- UI is responsive
- Existing functionality is not broken

PR description should include:

- What changed
- Why it changed
- Screenshots (if UI related)
- Related issue (if any)

Example

```text
## Description

Improved Workspace Hero layout.

## Changes

- Reduced spacing
- Updated typography
- Improved mobile layout

## Screenshot

<image>

Closes #12
```

---

# Coding Standards

## General

- Keep components small and reusable.
- Avoid duplicated logic.
- Prefer composition over large components.
- Remove unused imports.
- Use meaningful names.

Good

```
CareerSummary.jsx

ResumeDropzone.jsx

WorkspaceHeader.jsx
```

Avoid

```
Card2.jsx

NewComponent.jsx

Data.jsx
```

---

## Components

Components should only be responsible for rendering UI.

Business logic belongs in:

- hooks
- services

---

## Hooks

Hooks should manage:

- state
- effects
- API interactions

Avoid rendering JSX inside hooks.

---

## Services

Services should contain:

- API calls
- Supabase queries
- AI requests
- Business logic

Services should never render UI.

---

## Feature Architecture

Each feature should remain isolated.

Example

```
features/

resume/

workspace/

jobs/

profile/
```

Avoid importing unrelated feature internals.

---

# Design System

Finder follows a strict design system.

## Colors

- Neutral first
- Primary only for emphasis
- Status colors only when necessary

## Radius

8px

## Typography

Heading

Work Sans

Body

Inter

## Shadows

Avoid heavy shadows.

Prefer subtle borders.

## Motion

150–200ms only.

No excessive animations.

---

# UI/UX Principles

Finder is not a traditional job board.

Finder is an AI Career Intelligence Platform.

Every screen should answer one primary question.

Examples

Landing

→ Upload Resume

Workspace

→ Understand Your Career

Jobs

→ Explore AI Recommendations

Profile

→ Manage Professional Profile

Avoid unnecessary visual complexity.

Focus on clarity.

---

# AI Guidelines

When working with AI-related features:

- Keep prompts deterministic whenever possible.
- Never hardcode AI responses.
- Structured output should be preferred.
- Avoid hallucinated placeholder data.

---

# Documentation

If your change affects:

- architecture
- API
- environment variables
- design system

please update the documentation.

---

# Reporting Bugs

Please include:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots
- Browser
- Operating system

---

# Suggesting Features

Feature requests should explain:

- Problem
- Proposed solution
- Alternative solutions
- Additional context

---

# Code Review

Every Pull Request will be reviewed for:

- Code quality
- Readability
- Maintainability
- Performance
- Consistency with the design system
- Consistency with the project architecture

Please be open to feedback.

Code reviews are collaborative, not personal.

---

# Community

Be respectful.

Help others.

Share knowledge.

Constructive feedback is always appreciated.

---

Thank you for helping build Finder ❤️
