# Design System

Finder implements a minimal, dark-mode-first aesthetic inspired by modern AI workspaces (ChatGPT, Claude, Cursor). The design avoids unnecessary decorative flourishes, heavy gradients, or gaming visuals in favor of professional clarity and focus.

---

## 1. Typography

- **Headings**: `Work Sans` (`font-heading`)
- **Body & UI**: `Inter` (`font-sans`)
- **Monospace (Code / Hashes / Nonces / IDs)**: `GeistMono` / `JetBrains Mono` / `font-mono`

---

## 2. Color Palette & Semantic Tokens

Finder uses Tailwind CSS 4 variables with semantic color tokens defined in `src/app/globals.css`:

| Token              | Purpose              | Typical Usage                                         |
| :----------------- | :------------------- | :---------------------------------------------------- |
| `background`       | Primary surface      | Page and application viewport background              |
| `card`             | Elevated surface     | Panels, cards, and modal dialog backgrounds           |
| `primary`          | Brand emphasis       | Primary buttons, active tabs, highlight badges        |
| `secondary`        | Subdued surface      | Inactive pills, code blocks, secondary chips          |
| `muted-foreground` | Secondary text       | Metadata, labels, timestamps, supporting explanations |
| `border`           | Subtle dividing line | Card outlines, dividers, table borders                |
| `destructive`      | Danger / Error       | Error banners, delete buttons, rejected statuses      |

---

## 3. Geometry & Spacing

- **Corner Radius**: Default border radius is `8px` (`rounded-lg` / `rounded-xl`). Avoid pill-shaped buttons for complex actions.
- **Borders over Shadows**: Favor subtle, high-contrast borders (`border border-border/80`) over heavy, blurry drop shadows.
- **Animations & Transitions**: Restrict transitions to subtle durations (`duration-150` to `duration-200`) on interactive states (`hover:`, `focus-visible:`). Avoid distracting auto-playing CSS animations.
