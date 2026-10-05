# Design System

Finder has one visual language across the product. The canonical token values live
in `src/app/globals.css` under `@theme inline`. Component primitives come from
shadcn conventions configured in `components.json`. This document explains the
system and its rules; the CSS file is authoritative for exact values.

## Direction

Finder is a professional career workspace, not a marketing page. The interface is
dark-first, calm, and information-dense. Hierarchy comes from spacing, border
contrast, and type weight rather than from decoration.

## Typography

- One sans family, Plus Jakarta Sans, loaded through `next/font` and exposed as
  `--font-sans`.
- Weights in use: 400, 500, 600, 700.
- Headings use the heading font variable, body text uses the sans variable.
- Sizes are small and consistent: base UI text is `text-xs` to `text-sm`, with
  `text-[11px]` for secondary metadata.

## Color

The palette is defined as CSS variables in three groups. Do not hardcode hex
values in components; use the semantic tokens.

| Group | Purpose |
| --- | --- |
| Sui identity | Black, white, gray, and two blues for wallet-related surfaces |
| Slush palette | Blue, glacier, violet, lavender, ember, yellow, mint for accents |
| Finder dark primitives | Background and three surface levels, text tiers, three border strengths |
| Semantic utilities | Action primary and hover, success, warning, danger, special |

Rules:

- Surfaces step through `bg`, `surface-1`, `surface-2`, `surface-3`. Use the
  smallest step that separates two regions.
- Borders use the three defined strengths. Do not invent opacity values.
- Color signals state only: mint for success, yellow for warning, ember for
  danger. Do not use accent color as decoration.

## Shape, elevation, spacing

- Radius is small and consistent. Most surfaces use `rounded-sm`. Avoid pill
  shapes except for status dots and badges that represent a real state.
- Elevation is minimal. Cards use a hairline border and `shadow-xs`. Shadow marks
  elevation, not style.
- Cards use `p-5` with `space-y-4` between blocks. Sections separate with a
  `border-b border-border/80` header.

## Layout

- The app shell is a sidebar plus content area. On mobile the sidebar becomes a
  drawer with a backdrop.
- Interactive targets are at least 44px tall where they are primary controls.
- Tables and long rows scroll horizontally rather than wrapping into noise.

## Components and states

| Element | Convention |
| --- | --- |
| Buttons | One primary action per view; secondary actions are outline or ghost |
| Cards | Border plus surface, no heavy shadow |
| Dialogs and drawers | WAI-ARIA role, labelled, focus trapped, Escape to close, focus restored to the trigger |
| Loading | Content-matching skeletons, never generic spinners over real content |
| Empty states | Explain why it is empty and give the next action |
| Errors | Inline banner or toast with a safe message and a dismiss control |
| Status | Real status only: pending, stored, failed, active, forgotten |

## Motion

Motion is restrained. Transitions are short (150 to 200 ms) and explain a state
change such as a drawer opening or a card entering. There is no decorative motion,
no parallax, and no animation that runs without a state change.

## Copy

- English, sentence case, specific.
- No em dashes in product copy.
- No marketing buzzwords and no claims without evidence.
- Status text must match the real backend state. Never show "stored" while a
  write is pending.
- Buttons name the action, not a generic label.

## Accessibility

- Visible focus ring on every interactive control.
- Keyboard reachable: Tab, Enter, and Escape for dialogs and drawers.
- Text contrast meets WCAG AA for body and large text.
- Icon-only buttons carry an `aria-label`.

## When adding UI

1. Reuse an existing primitive before creating a new one.
2. Use semantic tokens, never raw hex values.
3. Cover empty, loading, and error states.
4. Keep one primary action per view.
