# Product Vision & Philosophy

Finder is an open-source **AI-Powered Career Intelligence Platform and Job Discovery Workspace**.

This document outlines the core purpose, philosophy, and strategic vision guiding Finder's product decisions and architectural evolution.

---

## 1. The Core Problem

Traditional job boards operate as passive keyword search engines:

- **Keyword Mismatch**: Boolean search forces candidates to guess the exact terminology used by recruiters, overlooking transferable skills.
- **Transactional Fatigue**: Platforms encourage endless, low-context job applications ("apply and pray") rather than strategic career alignment.
- **Lack of Actionable Feedback**: Candidates are rarely shown _why_ a role fits them or _what specific skills_ they need to bridge to qualify.
- **Fragmented Identity**: Professional data is siloed within proprietary platforms without user ownership or cryptographic portability.

---

## 2. Our Mission

> **To transform job search from passive keyword hunting into an empowering, AI-guided career intelligence journey.**

Finder does not treat users as resumes to be filtered; it acts as a personal career strategist that:

1. **Extracts Deep Context**: Automatically synthesizes unstructured resume documents into structured career profiles (core skills, supporting tools, seniority, strengths, and role trajectories).
2. **Curates Intelligent Matches**: Employs a resilient two-stage matching pipeline combining deterministic database pre-filtering with LLM qualitative fit analysis.
3. **Explains Every Recommendation**: Transparently surfaces match scores, tailored match rationales, and exact skill gaps for every role.
4. **Enables Real-Time Career Consulting**: Delivers a persistent, conversational Career Copilot to simulate technical interviews, refine positioning, and explore career pivots.

---

## 3. Product Pillars

### I. Career Intelligence Before Recommendation

We believe recommendations are meaningless without deep candidate comprehension. Before suggesting any job, Finder extracts candidate strengths, seniority level, and skill taxonomy. Recommendations are grounded in qualitative alignment, not surface-level keyword frequency.

### II. Conversational, Chat-First Workspace

Careers are nuanced and dynamic. Rather than rigid form wizards, Finder provides an interactive workspace centered around natural language dialogue. Candidates can question recommendations, seek interview preparation tips, and refine their career goals interactively.

### III. Extreme AI Resilience & Predictability

Production AI applications must not fail abruptly when LLM providers experience rate limits (HTTP 429) or service degradation (HTTP 503). Finder pairs active Groq models (`qwen/qwen3.8-27b` and fallback `openai/gpt-oss-20b`) with deterministic algorithmic fallbacks (`55 + overlapRatio * 35`) to ensure candidates never encounter broken states.

### IV. Dual Identity & Web3 Sovereignty

Finder bridges Web2 accessibility with Web3 cryptographic autonomy. Users can authenticate seamlessly using standard email credentials or cryptographic **Sign-In with Sui (SIWS)**. Over time, candidates will own their career credentials and encrypted documents through decentralized networks like Sui and Walrus.

---

## 4. Design & Interaction Principles

- **Single Primary Action**: Every view provides one primary objective to eliminate decision fatigue.
- **Calm, High-Contrast Interface**: Focused typography and subtle borders replace noisy badges and heavy drop shadows.
- **Educational Empty States**: If no matches or messages exist, views guide the user on the exact next step rather than presenting blank slates.
- **Predictable Performance**: Skeleton loaders and streaming SSE tokens maintain visual responsiveness and transparency during compute-heavy AI tasks.

---

## 5. Strategic Roadmap Overview

| Horizon              | Strategic Focus                              | Key Milestones                                                                                              |
| :------------------- | :------------------------------------------- | :---------------------------------------------------------------------------------------------------------- |
| **Current (v1.0)**   | AI Resume Intelligence & Dual Auth           | PDF extraction, 2-stage matching, Groq SSE Copilot, SIWS authentication, Remotive ingestion.                |
| **Near-Term (v1.5)** | Interactive Job Management & Profile Builder | Manual profile editor, saved/bookmarked jobs, dismissed job filtering, application status tracking.         |
| **Long-Term (v2.0)** | Decentralized Memory & Autonomous Agents     | Walrus blob storage for encrypted resumes, MemWal persistent cross-session memory, Groq agent tool calling. |

For detailed development status, see the [Product Roadmap](roadmap.md).
