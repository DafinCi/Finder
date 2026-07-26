# CLAUDE.md

# Finder AI Agent Instructions

This document provides essential context for AI coding assistants working on the Finder repository.

Always read this document before making architectural or implementation decisions.

For detailed documentation, refer to:

- docs/vision.md
- docs/architecture.md
- docs/design-system.md
- docs/ui-principles.md
- docs/coding-standards.md
- docs/roadmap.md
- docs/contribution-guide.md

---

# Project Overview

Finder is an AI-powered Career Intelligence Platform.

Finder is NOT a traditional job board.

The primary purpose of Finder is helping users understand their professional profile before applying for jobs.

Job recommendations are one result of AI analysis, not the product itself.

Users should feel like they are collaborating with an intelligent career assistant rather than browsing a recruitment website.

---

# Product Vision

Always keep these principles in mind.

Career before Jobs.

Understanding before Recommendation.

Insight before Metrics.

Growth before Application.

The AI Workspace is the heart of the product.

Everything should reinforce this vision.

---

# Core Product Philosophy

Finder should feel like modern AI-native products such as:

- ChatGPT
- Claude
- Perplexity
- Cursor

The first interaction should immediately encourage users to upload their resume.

After upload:

Resume

↓

Workspace

↓

AI Analysis

↓

Career Insights

↓

Job Recommendations

↓

Career Growth

The experience should never resemble a traditional job portal.

Avoid building interfaces similar to JobStreet, Indeed, or LinkedIn Jobs.

---

# Design Philosophy

Finder should always feel:

- Calm
- Professional
- Intelligent
- Helpful
- Minimal

Avoid:

- Cyberpunk
- Glassmorphism
- Heavy gradients
- Decorative animations
- Gaming aesthetics
- Unnecessary visual effects

Design should communicate trust and professionalism.

---

# Design System Rules

Always follow the official design system.

Highlights:

- Dark mode only
- Neutral-first color palette
- Primary color reserved for important actions
- Radius: 8px
- Border preferred over shadow
- Minimal motion (150–200ms)
- Work Sans for headings
- Inter for body text

Do not introduce new design patterns without discussion.

---

# UI Principles

Every page should have exactly ONE primary action.

Examples:

Landing

Primary Action:
Upload Resume

Workspace

Primary Action:
Understand AI Analysis

Jobs

Primary Action:
Explore Recommended Jobs

Profile

Primary Action:
Maintain Professional Profile

Avoid multiple competing CTAs.

---

# Workspace Philosophy

Workspace is not a dashboard.

Workspace is the living document of the user's career.

Workspace should progressively evolve as AI generates more information.

Possible sections include:

- Resume Analysis
- Professional Summary
- Strengths
- Skill Gaps
- Career Recommendations
- Learning Recommendations
- Recommended Jobs
- Market Insights

The Workspace should become more valuable over time.

---

# Architecture Principles

Follow Feature-Based Architecture.

Business logic must remain inside feature services.

Views orchestrate.

Hooks manage reusable state.

Components render UI.

Never mix responsibilities.

Preferred flow:

View

↓

Hook

↓

Service

↓

API

↓

Database

---

# Component Responsibilities

Components

Responsible for:

- Rendering UI
- Receiving props
- User interaction

Components should NOT:

- Fetch data
- Perform AI processing
- Execute business logic

---

Views

Responsible for:

- Page composition
- Connecting hooks
- Organizing layout

Views should remain lightweight.

---

Hooks

Responsible for:

- Client-side state
- UI behavior
- Shared logic

Avoid API implementation inside hooks whenever possible.

---

Services

Responsible for:

- Business logic
- AI requests
- API communication
- Data transformation

Most application logic belongs here.

---

API Routes

Responsible for:

- Authentication
- Validation
- Calling services
- Returning responses

Avoid implementing business logic directly inside API routes.

---

# AI Guidelines

AI-generated content must always be:

- Explainable
- Actionable
- Honest
- Professional

Never invent candidate information.

Never fabricate experience.

Never fabricate statistics.

Never create fake percentages.

Every recommendation should explain WHY.

Recommendations should encourage career growth rather than simply listing missing skills.

Preferred tone:

Professional mentor.

Avoid sounding robotic.

Avoid exaggerated motivational language.

---

# Coding Standards

Always follow:

- Feature-Based Architecture
- Clean Code
- Single Responsibility Principle
- Composition over inheritance
- Reusable components
- Predictable folder structure

Naming:

Components

PascalCase

Hooks

useSomething

Services

something.service.js

Constants

UPPER_SNAKE_CASE

Variables

camelCase

Folders

kebab-case

---

# Code Quality

Prefer readable code over clever code.

Avoid unnecessary abstractions.

Keep functions focused.

Keep files reasonably small.

Reuse existing utilities whenever possible.

Avoid duplicated business logic.

---

# Dependencies

Before introducing a new dependency:

Ask:

Can this be solved using existing libraries?

Avoid dependency bloat.

---

# Performance

Prefer:

Lazy loading

Memoization only when necessary

Server Components where appropriate

Avoid unnecessary client rendering.

Avoid unnecessary re-renders.

---

# Accessibility

Always consider:

Keyboard navigation

ARIA labels

Focus states

Semantic HTML

Readable color contrast

Accessibility is required.

---

# Error Handling

Never expose raw server errors.

Use human-friendly error messages.

Good example:

"We couldn't analyze your resume.
Please try uploading another PDF."

Bad example:

"500 Internal Server Error"

---

# Loading States

Prefer skeletons.

Avoid spinners whenever possible.

AI processing should communicate what is happening.

Preferred example:

Analyzing your professional experience...

Extracting technical skills...

Matching your profile...

Generating career insights...

Instead of:

Loading...

---

# Empty States

Every empty state should educate users.

Example:

Upload your first resume to unlock personalized career insights powered by AI.

Do not leave blank pages.

---

# Pull Request Expectations

Every change should:

- Follow the architecture
- Follow the design system
- Preserve consistency
- Avoid duplication
- Keep documentation updated when necessary

Large architectural changes should be discussed before implementation.

---

# Things You SHOULD Do

- Reuse existing components.
- Reuse existing services.
- Follow the design system.
- Follow product philosophy.
- Keep pages clean.
- Keep architecture consistent.
- Write maintainable code.
- Prefer clarity over cleverness.

---

# Things You MUST NOT Do

Do NOT redesign Finder into a traditional job portal.

Do NOT introduce visual styles outside the design system.

Do NOT create duplicate business logic.

Do NOT hardcode colors.

Do NOT hardcode spacing values.

Do NOT bypass services.

Do NOT place business logic inside components.

Do NOT introduce unnecessary dependencies.

Do NOT fabricate AI results.

Do NOT invent candidate information.

Do NOT create fake metrics.

---

# When You're Unsure

If a request conflicts with:

- Product Vision
- Design System
- Architecture
- Coding Standards

Choose consistency over novelty.

If behavior is ambiguous, preserve the existing architecture and ask for clarification instead of making assumptions.

---

# Final Principle

Every contribution should make Finder feel more like an intelligent AI Career Workspace and less like a traditional job portal.

If a change improves consistency, clarity, usability, and maintainability while respecting the project's vision, it is likely the correct direction.
