# Finder — Sui/Slush Visual System + WhatsApp-Inspired Messaging System

**Document status:** Implementation specification / design-system source of truth  
**Version:** 2.0  
**Last verified:** 2026-10-01  
**Theme:** Dark-only application UI  
**Framework target:** Tailwind CSS v4  
**Primary product:** Finder — AI-powered job discovery / conversational job platform  
**Visual foundation:** Sui + Slush  
**Interaction reference:** WhatsApp  
**Product semantics:** Finder-specific

---

## 0. Purpose

This document defines the visual, interaction, component, token, accessibility, responsive, and implementation rules for Finder.

Finder intentionally combines three different sources of design knowledge:

1. **Sui** — ecosystem identity and technical visual language.
2. **Slush** — product/brand expression, typography, color palette, rounded geometry, and visual character.
3. **WhatsApp** — documented messaging design principles and publicly documented interaction patterns for conversations.

The goal is **not** to reproduce either product.

The intended result is:

> **A Sui-native Finder interface with Slush-inspired visual language and WhatsApp-inspired conversational interaction patterns.**

The distinction matters:

```text
Sui / Slush
    ↓
Visual identity
    ↓
Finder
    ↑
Messaging interaction patterns
    ↑
WhatsApp
```

Finder-specific AI, job-search, memory, Web3, and information architecture decisions remain owned by Finder.

---

# 1. Source-of-Truth Hierarchy

When implementing or changing Finder UI, use sources in this order.

## 1.1 Tier A — Official product / brand documentation

These are authoritative for the claims explicitly made in them.

### Sui

Official Sui documentation:

- Sui Technical Diagram Standards:
  https://docs.sui.io/references/contribute/diagram-standards

The current Sui documentation identifies:

- Black `#000000`
- White `#FFFFFF`
- Gray 500 `#6C7584`
- Sui Blue 500 `#298DFF`
- Sui Blue 600 `#1759C4` for smaller blue text on white
- TWK Everett as the Sui Brand Kit primary typeface
- Inter as the approved typeface for Sui diagrams

Important:

**Inter is documented by Sui for diagrams. It is not evidence that Finder's entire application UI must use Inter.**

### Slush

Official Slush brand assets:

https://slush.app/brand-assets

The official Slush page documents:

#### Colors

| Name | Hex |
|---|---|
| Blue Blizzard | `#4DA2FF` |
| Glacier Glow | `#DCEEFF` |
| Frostbite Fuel | `#5C4ADE` |
| Frosted Bloom | `#E9CCFF` |
| Citrine Swirl | `#FB4903` |
| Banana Blitz | `#FFD731` |
| Mint Mirage | `#55DB9C` |
| White | `#FFFFFF` |
| Black | `#000000` |

#### Typography

Finder standardizes on **Plus Jakarta Sans** across all headers, display surfaces, and application UI. This delivers a consistent, modern geometric neo-grotesque visual identity with zero licensing barriers.

### WhatsApp / Meta

Official WhatsApp design article:

https://www.meta.com/design-at-meta/blog/whatsapp-user-interface-update/

Meta's WhatsApp Design team documents these product-design principles:

- Fresh
- Approachable
- Simple

The article also explicitly discusses:

- designing to feel familiar and native to the device
- preserving muscle memory
- supporting different levels of connectivity and digital literacy
- a consistent color palette with increased neutral usage
- darker dark mode
- rounded outlined iconography
- chat filters
- attachment trays
- bottom navigation on Android
- organization of chats
- simple, clear flows

Official WhatsApp brand resources:

https://www.meta.com/brand/resources/whatsapp/whatsapp-brand/

Use this for WhatsApp trademark/brand-asset restrictions.

### Tailwind CSS v4

Official Tailwind documentation:

https://tailwindcss.com/docs/theme  
https://tailwindcss.com/docs/dark-mode  
https://tailwindcss.com/docs/colors  
https://tailwindcss.com/docs/functions-and-directives  
https://tailwindcss.com/docs/color-scheme

Tailwind v4 uses CSS-first theme configuration through `@theme` and supports custom variants through `@custom-variant`.

---

## 1.2 Tier B — Public reconstruction / reference

Finder may use this material to understand a source design system, but it must not be described as official.

### Refero Slush Style Reference

User-provided reference:

https://styles.refero.design/style/8b6b547f-a357-4f1b-9842-4579c62dd42b

Refero explicitly states that:

- source measurements are normalized
- roles and recommendations are interpreted
- font summary lists are independent
- HTML examples are reconstructions, not source components

Therefore:

> Refero is a useful reconstruction/reference layer, not an authoritative Slush implementation specification.

The Refero reconstruction is useful for understanding:

- 4px spacing base
- comfortable density
- 20–40px card radius
- pill controls
- geometric typography hierarchy
- black outlines
- Slush palette usage
- design-token naming
- Tailwind v4 representation

Do not present these reconstructed values as official Slush application requirements.

---

## 1.3 Tier C — Finder adaptation

Everything explicitly marked **Finder-specific** in this document is an implementation decision.

Examples:

- dark-only application surfaces
- semantic color mapping
- chat bubble colors
- AI message styling
- job result cards
- conversation sidebar
- mobile chat layout
- message state model
- streaming state
- memory state
- Sui/Slush colors adapted to dark surfaces
- Finder spacing adjustments
- Finder-specific radius adjustments

These are not claims that Sui, Slush, or WhatsApp officially use those exact values.

---

# 2. Core Design Philosophy

## 2.1 Ownership model

| Concern | Primary source | Finder rule |
|---|---|---|
| Ecosystem identity | Sui | Use Sui language where relevant |
| Brand palette | Slush + Sui | Use documented source colors |
| Brand typography | Finder | Plus Jakarta Sans for headers and brand display |
| Technical typography | Finder / Sui | Plus Jakarta Sans (UI) / Monospace for hashes and code |
| Application typography | Finder | Plus Jakarta Sans for all application UI |
| Messaging layout | WhatsApp | Adapt interaction structure |
| Message actions | WhatsApp | Adapt documented interaction patterns |
| Chat organization | WhatsApp | Adapt filters and conversation management |
| AI behavior | Finder | Define independently |
| Job result presentation | Finder | Define independently |
| Web3 state | Finder + Sui | Define independently |
| Accessibility | WCAG + platform conventions | Mandatory |
| Implementation | Tailwind CSS v4 | Token-first |

---

## 2.2 Design rule

### Sui / Slush answers:

> “What should Finder feel and look like?”

### WhatsApp answers:

> “How should a conversation interface behave?”

### Finder answers:

> “What does the conversation mean?”

This separation prevents visual and behavioral copying.

---

# 3. Non-Negotiable Agent Contract

AI agents modifying Finder UI MUST follow these rules.

## 3.1 Do not clone WhatsApp

Do not copy:

- WhatsApp logo
- WhatsApp wordmark
- WhatsApp iconography
- WhatsApp proprietary illustrations
- WhatsApp exact visual identity
- WhatsApp green as Finder's primary brand color
- screenshots pixel-for-pixel
- proprietary assets

Meta's official brand resources explicitly instruct users to use current WhatsApp brand resources and avoid confusingly similar use.

Source:

https://www.meta.com/brand/resources/whatsapp/whatsapp-brand/

---

## 3.2 Do not clone Slush

Do not assume that the entire Slush marketing aesthetic belongs in Finder's application.

Do not automatically add:

- giant 3D ribbons
- sticker collages
- huge compressed display text
- pastel full-page backgrounds
- decorative stickers around every component
- rainbow colors everywhere

These are part of Slush's communication/brand expression, not a requirement for a job-search chat application.

---

## 3.3 Token first

Do not introduce:

```tsx
className="bg-[#298DFF]"
```

when a semantic token exists.

Prefer:

```tsx
className="bg-sui-blue-500"
```

or, preferably for component semantics:

```tsx
className="bg-action-primary"
```

Do not introduce arbitrary:

- colors
- spacing
- radii
- shadows
- typography sizes
- z-index values
- transition durations

without first determining whether an existing token already represents the need.

---

## 3.4 Evidence labels

Every future design-system decision should be classified as:

```text
[OFFICIAL]
[REFERENCE]
[FINDER]
```

### [OFFICIAL]

Directly documented by Sui, Slush, Meta/WhatsApp, or Tailwind.

### [REFERENCE]

Public reconstruction or observation.

### [FINDER]

A deliberate adaptation for Finder.

Never convert `[REFERENCE]` into `[OFFICIAL]` merely because it looks accurate.

---

# 4. Brand System

# 4.1 Sui identity

The Sui documentation's technical visual system uses:

```text
Black       #000000
White       #FFFFFF
Gray 500    #6C7584
Sui Blue 500 #298DFF
Sui Blue 600 #1759C4
```

Source:

https://docs.sui.io/references/contribute/diagram-standards

The Sui documentation describes Sui Blue 500 as a tertiary/highlight color in its diagram system and Sui Blue 600 as a higher-contrast blue for small text on white.

### Finder usage

`[FINDER]`

Use Sui Blue as the primary ecosystem signal.

Do not treat every Sui color as an application semantic color.

---

# 4.2 Slush identity

Official Slush colors:

```css
--slush-blue-blizzard: #4DA2FF;
--slush-glacier-glow: #DCEEFF;
--slush-frostbite-fuel: #5C4ADE;
--slush-frosted-bloom: #E9CCFF;
--slush-citrine-swirl: #FB4903;
--slush-banana-blitz: #FFD731;
--slush-mint-mirage: #55DB9C;
--slush-white: #FFFFFF;
--slush-black: #000000;
```

Source:

https://slush.app/brand-assets

The Refero reconstruction calls these Electric Blue, Sky Wash, Voltage Violet, Lavender, Ember, Sunburst, Mint Pop, Paper White, and Carbon. Those names should not replace the official Slush names in Finder's documentation.

---

# 4.3 Color ownership

Use the following hierarchy.

```text
Sui Blue / Slush Blue
        ↓
Primary brand identity

Black / dark neutrals
        ↓
Application chrome and structure

White / light neutrals
        ↓
Primary text and high-contrast content

Violet
        ↓
Optional Finder AI / special state

Mint
        ↓
Positive semantic state where appropriate

Yellow
        ↓
Warning / attention where appropriate

Ember
        ↓
Destructive/error state where appropriate
```

The semantic mapping of Mint/Yellow/Ember/Violet is **Finder-specific**.

Slush's official brand page does not define these colors as Finder-style semantic states.

---

# 5. Dark-Only Finder System

## 5.1 Why dark-only?

Finder's current product requirement is dark-only.

This is a Finder product decision.

It is not a claim that Slush is a dark-mode-only product.

It is also not a claim that WhatsApp's entire product is dark-only.

Meta's 2024 WhatsApp design article documents a darker dark mode and increased neutral usage, which supports the design rationale for dark UI but does not prescribe Finder's exact colors.

Source:

https://www.meta.com/design-at-meta/blog/whatsapp-user-interface-update/

---

## 5.2 Finder dark surfaces

These are **Finder-specific semantic tokens**.

They are intentionally not described as official Sui or Slush colors.

```css
:root {
  --finder-bg: #0B0D10;
  --finder-surface-1: #111419;
  --finder-surface-2: #171B22;
  --finder-surface-3: #1D222B;

  --finder-border-subtle: rgba(255, 255, 255, 0.08);
  --finder-border-default: rgba(255, 255, 255, 0.12);
  --finder-border-strong: rgba(255, 255, 255, 0.18);

  --finder-text-primary: #F7F8FA;
  --finder-text-secondary: #B5BBC5;
  --finder-text-tertiary: #858C98;
  --finder-text-disabled: #626975;
}
```

### Rationale

These values provide a dark neutral hierarchy while reserving the documented Sui/Slush colors for identity and semantic emphasis.

They are implementation values, not copied source tokens.

---

# 6. Design Tokens

## 6.1 Token layers

Finder uses four token layers:

```text
Primitive
   ↓
Semantic
   ↓
Component
   ↓
State
```

Example:

```text
#298DFF
   ↓
--color-sui-blue-500
   ↓
--color-action-primary
   ↓
--color-button-primary-bg
```

Do not jump directly from primitive to component everywhere.

---

# 6.2 Primitive color tokens

```css
@theme {
  /* Sui */
  --color-sui-black: #000000;
  --color-sui-white: #FFFFFF;
  --color-sui-gray-500: #6C7584;
  --color-sui-blue-500: #298DFF;
  --color-sui-blue-600: #1759C4;

  /* Slush */
  --color-slush-blue: #4DA2FF;
  --color-slush-glacier: #DCEEFF;
  --color-slush-violet: #5C4ADE;
  --color-slush-lavender: #E9CCFF;
  --color-slush-ember: #FB4903;
  --color-slush-yellow: #FFD731;
  --color-slush-mint: #55DB9C;
  --color-slush-white: #FFFFFF;
  --color-slush-black: #000000;
}
```

`@theme` is the Tailwind v4 mechanism for defining theme variables that generate utilities.

Source:

https://tailwindcss.com/docs/theme

---

# 6.3 Finder dark primitive tokens

```css
@theme {
  --color-finder-bg: #0B0D10;
  --color-finder-surface-1: #111419;
  --color-finder-surface-2: #171B22;
  --color-finder-surface-3: #1D222B;

  --color-finder-text-primary: #F7F8FA;
  --color-finder-text-secondary: #B5BBC5;
  --color-finder-text-tertiary: #858C98;
  --color-finder-text-disabled: #626975;

  --color-finder-border-subtle: rgba(255,255,255,0.08);
  --color-finder-border-default: rgba(255,255,255,0.12);
  --color-finder-border-strong: rgba(255,255,255,0.18);
}
```

---

# 6.4 Semantic tokens

Use semantic names in components.

```css
:root {
  --background: var(--color-finder-bg);

  --surface-default: var(--color-finder-surface-1);
  --surface-elevated: var(--color-finder-surface-2);
  --surface-overlay: var(--color-finder-surface-3);

  --foreground: var(--color-finder-text-primary);
  --foreground-muted: var(--color-finder-text-secondary);
  --foreground-subtle: var(--color-finder-text-tertiary);
  --foreground-disabled: var(--color-finder-text-disabled);

  --border: var(--color-finder-border-default);
  --border-subtle: var(--color-finder-border-subtle);
  --border-strong: var(--color-finder-border-strong);

  --action-primary: var(--color-sui-blue-500);
  --action-primary-hover: var(--color-slush-blue); /* #4DA2FF: high-luminance hover on dark surfaces */

  --state-success: var(--color-slush-mint);
  --state-warning: var(--color-slush-yellow);
  --state-danger: var(--color-slush-ember);
  --state-special: var(--color-slush-violet);
  --state-special-foreground: var(--color-slush-lavender); /* #E9CCFF: WCAG AA compliant text contrast (>12:1 on dark) */
}
```

These semantic mappings are Finder decisions.

### 6.5 Framework / Base Component Harmonization

To ensure seamless integration with component libraries (such as shadcn / `@base-ui/react`), map Finder semantic tokens directly to the framework's theme variables:

| Framework Variable | Finder Token | Resolved Value |
|---|---|---|
| `--background` | `--color-finder-bg` | `#0B0D10` |
| `--card` / `--surface` | `--color-finder-surface-1` | `#111419` |
| `--popover` | `--color-finder-surface-2` | `#171B22` |
| `--foreground` | `--color-finder-text-primary` | `#F7F8FA` |
| `--muted-foreground` | `--color-finder-text-secondary` | `#B5BBC5` |
| `--border` | `--color-finder-border-default` | `rgba(255, 255, 255, 0.12)` |
| `--primary` | `--action-primary` | `#298DFF` |
| `--primary-foreground` | `--color-sui-white` | `#FFFFFF` |
| `--accent` | `--color-finder-surface-2` | `#171B22` |

---

# 7. Typography

## 7.1 Primary Typography — Plus Jakarta Sans

Finder standardizes on **Plus Jakarta Sans** as the single primary typeface for all product UI, conversational text, display headers, and brand surfaces.

### Rationale
- **Modern Neo-Grotesque Geometry**: Delivers the clean, contemporary aesthetic of modern Web3 and AI tools without informal quirks.
- **Open-Source & Free (SIL OFL)**: Eliminates licensing fees, seat restrictions, and domain/pageview limitations.
- **Exceptional Readability**: Optimized for small UI elements (tags, badges, timestamps) and balanced character rendering in headings.

```css
@theme {
  --font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-heading: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
}
```

---

## 7.2 Technical / Monospace Typography

For cryptographic hashes, Sui addresses, nonces, and code blocks:

```css
@theme {
  --font-mono: "GeistMono", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
```

---

## 7.3 Font Stack & Fallback

```css
font-family:
  "Plus Jakarta Sans",
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  Roboto,
  "Noto Sans",
  sans-serif;
```

---

## 7.4 Finder Type Scale

Finder uses a balanced, readable type scale calibrated for conversational density, adapted from Slush and WhatsApp design patterns:

| Token | Size | Line Height | Usage in Finder |
|---|---|---|---|
| `--text-xs` | 12px (0.75rem) | 1.38 | Timestamps, badges, status indicators, secondary metadata |
| `--text-sm` | 13px (0.8125rem) | 1.35 | Captions, helper text, tags, session subtitle in sidebar |
| `--text-base` | 15px (0.9375rem) | 1.40 | Default chat message body, UI controls, omnibar input |
| `--text-lg` | 16px (1rem) | 1.35 | Emphasized message text, card titles, drawer nickname editor |
| `--text-xl` | 20px (1.25rem) | 1.25 | Drawer headers, dialog titles, section headers |
| `--text-2xl` | 24px (1.5rem) | 1.20 | Empty state greeting headlines, modal titles |
| `--text-3xl` | 30px (1.875rem) | 1.15 | Page headers, primary feature intros |
| `--text-4xl` | 36px (2.25rem) | 1.10 | Hero display and brand moments |

```css
@theme {
  --text-xs: 0.75rem;     /* 12px - Timestamps, badges, secondary metadata */
  --text-sm: 0.8125rem;   /* 13px - Captions, helper text, tags */
  --text-base: 0.9375rem; /* 15px - Default chat message body, UI controls */
  --text-lg: 1rem;        /* 16px - Emphasized message text, card titles */
  --text-xl: 1.25rem;     /* 20px - Section headers */
  --text-2xl: 1.5rem;     /* 24px - Modal and conversation titles */
  --text-3xl: 1.875rem;   /* 30px - Page headers */
  --text-4xl: 2.25rem;    /* 36px - Brand moments and Hero display */
}
```

## 7.5 Conversational Reading Rhythm

Adapted from WhatsApp reading rhythm guidelines:
- Body text is paired with generous line-height (1.34 to 1.40) to prevent conversational blocks from feeling cramped.
- Relaxed leading increases scanning comfort for long job recommendations and career analysis summaries.
- Headlines use tighter line-height (1.10 to 1.25) to maintain punchy presence without creating vertical whitespace gaps.

---

# 8. Spacing

## 8.1 Source

Refero reconstructs a 4px base unit for Slush.

This is `[REFERENCE]`.

Finder adopts a 4px base as a product implementation rule.

```css
@theme {
  --spacing: 0.25rem;
}
```

Tailwind v4's spacing utilities are driven by the `--spacing` theme variable.

Source:

https://tailwindcss.com/docs/margin

---

## 8.2 Finder spacing scale

```text
1   = 4px
2   = 8px
3   = 12px
4   = 16px
5   = 20px
6   = 24px
7   = 28px
8   = 32px
10  = 40px
12  = 48px
16  = 64px
20  = 80px
24  = 96px
```

Use the existing Tailwind spacing utilities whenever possible.

---

## 8.3 Conversational Spacing Rhythm

Adapted from WhatsApp 4px base spacing scale and comfortable density:

| Spacing Token | Pixels | Application in Finder UI |
|---|---|---|
| `p-1`, `gap-1` | 4px | Micro-gaps between status dot and text, icon paddings |
| `p-2`, `gap-2` | 8px | Button internal padding, avatar to title gap |
| `p-3`, `gap-3` | 12px | Sidebar session item padding, compact card padding |
| `p-4`, `gap-4` | 16px | Container padding, standard card margins, drawer padding |
| `p-5`, `gap-5` | 20px | Section gutters, spacing between grouped card sections |
| `p-6`, `gap-6` | 24px | Modal dialog padding, drawer header padding |
| `p-8`, `gap-8` | 32px | Empty state hero spacing, major layout gaps |

### Key Dimensional Constraints

1. **Omnibar Input**: Compact horizontal single-row with base height of 44 to 48px, icon-only attachment button, auto-expanding textarea, and direct send button.
2. **Sidebar Width Limits**:
   - Minimum width: 240px
   - Maximum width: 420px
   - Default width: 260px
   - Draggable desktop splitter with 60fps tracking and localStorage persistence (`finder_sidebar_width`).

---

# 9. Radius

Slush's official brand page establishes the overall brand but does not publish a complete application radius scale.

Refero reconstructs:

- cards: 20px
- elevated cards: 40px
- body: 30px
- pills/buttons: 1600px
- wallet icon: 16px

These are `[REFERENCE]`.

Finder adapts them for messaging density:

```css
@theme {
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.25rem;
  --radius-2xl: 1.5rem;
  --radius-pill: 9999px;
}
```

### Finder usage

| Component | Radius | Token |
|---|---|---|
| Small control / Tag | `md` | `rounded-md` (0.75rem / 6px) |
| Input / Search bar | `lg` | `rounded-lg` (1rem / 8px) |
| Card / Container | `xl` | `rounded-xl` (1.25rem / 12px) |
| Dialog / Modal | `2xl` | `rounded-2xl` (1.5rem / 16px) |
| Message bubble | `lg` / `xl` | `rounded-lg` / `rounded-xl` |
| Filter / Chips / Suggestion pill | `pill` | `rounded-full` (9999px) |
| Button (Action / Primary) | `xl` | `rounded-xl` (10–12px) |
| Avatar | full | `rounded-full` |

> **Button Geometry Rule**: Primary and secondary action buttons (*Send*, *Upload*, *Apply Now*, *Save*) use `rounded-xl` (`10px–12px`) rather than full pill shape. Full pills are reserved exclusively for filter chips, category prompts, and status badges. This ensures visual authority and professional trust for career-defining actions while maintaining modern geometry.

Do not force the Slush 20–40px marketing-card radius onto every messaging element.

---

# 10. Borders

Slush's Refero reconstruction emphasizes black outlines.

In Finder dark mode, a literal `1px solid #000000` around every element would not preserve the same contrast relationship.

Therefore:

```text
Slush principle
    ↓
Strong outline language

Finder implementation
    ↓
Subtle neutral border hierarchy
```

Use:

```css
--border-subtle
--border-default
--border-strong
```

and reserve stronger Sui-blue borders for active/focused states.

---

# 11. Shadows and Elevation

Do not copy Slush's marketing shadows because the Refero reconstruction explicitly emphasizes flat surfaces and outlines rather than conventional elevation.

Finder should prefer:

```text
surface contrast
+
border
+
layering
```

over:

```text
large blur shadow
```

Use shadows only where an overlay needs separation from the underlying conversation.

---

# 12. Tailwind CSS v4 Implementation

## 12.1 Import

Use the Tailwind v4 CSS-first approach:

```css
@import "tailwindcss";
```

---

## 12.2 Theme variables

Put project tokens in the global CSS entry point.

Example:

```css
@import "tailwindcss";

@theme {
  --color-sui-blue-500: #298DFF;
  --color-sui-blue-600: #1759C4;

  --color-slush-blue: #4DA2FF;
  --color-slush-violet: #5C4ADE;
  --color-slush-lavender: #E9CCFF;
  --color-slush-ember: #FB4903;
  --color-slush-yellow: #FFD731;
  --color-slush-mint: #55DB9C;

  --color-finder-bg: #0B0D10;
  --color-finder-surface-1: #111419;
  --color-finder-surface-2: #171B22;
  --color-finder-surface-3: #1D222B;

  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.25rem;
  --radius-2xl: 1.5rem;
  --radius-pill: 9999px;
}
```

---

# 13. Dark Mode Architecture

Finder is dark-only.

There is no user-facing light/dark switch.

Do not create:

```tsx
dark:bg-...
```

throughout the application simply because Tailwind supports dark mode.

Instead, make the base Finder application dark.

Tailwind supports explicit dark variants and custom variants, but those capabilities do not imply that Finder must support multiple themes.

Source:

https://tailwindcss.com/docs/dark-mode

---

## 13.1 Browser color scheme

For a dark-only product:

```css
html {
  color-scheme: dark;
}
```

or use the Tailwind `scheme-dark` utility where appropriate.

Tailwind documents:

- `scheme-dark`
- `scheme-only-dark`
- `scheme-light`
- `scheme-only-light`

Source:

https://tailwindcss.com/docs/color-scheme

Use `scheme-only-dark` only if the product must explicitly prevent user-agent fallback to light controls.

---

# 14. Responsive Layout Architecture

WhatsApp's 2024 design article emphasizes device-native behavior and mobile thumb accessibility.

Finder should therefore use two related layouts.

## Desktop

```text
┌─────────────────────────────────────────────────────────────┐
│ Finder shell                                                │
├──────────────────┬──────────────────────────────────────────┤
│ Conversation     │ Active conversation                       │
│ sidebar          │                                          │
│                  │ Header                                   │
│ Search           ├──────────────────────────────────────────┤
│ Filters          │                                          │
│                  │ Message timeline                         │
│ Chat list        │                                          │
│                  │                                          │
│                  ├──────────────────────────────────────────┤
│                  │ Composer                                 │
└──────────────────┴──────────────────────────────────────────┘
```

## Mobile

```text
┌──────────────────────┐
│ Conversation header  │
├──────────────────────┤
│                      │
│ Message timeline     │
│                      │
│                      │
├──────────────────────┤
│ Composer             │
└──────────────────────┘
```

Conversation list becomes a separate navigation surface rather than a permanently visible sidebar.

---

# 15. WhatsApp Interaction Principles

The following are supported by Meta's official WhatsApp design documentation.

## 15.1 Simple

Meta identifies simplicity as a design principle.

Finder implication:

- avoid unnecessary controls
- keep primary actions obvious
- do not expose advanced AI controls by default
- avoid visual noise in the conversation timeline

Source:

https://www.meta.com/design-at-meta/blog/whatsapp-user-interface-update/

---

## 15.2 Approachable

Meta describes WhatsApp as familiar, accessible, and native to the device.

Finder implication:

- use conventional interaction patterns
- preserve familiar keyboard behavior
- use recognizable icons
- do not create unusual gesture requirements for core actions
- keep destructive actions explicit

---

## 15.3 Preserve muscle memory

Meta explicitly says it considers muscle memory when changing WhatsApp.

Finder implication:

Do not invent novel interaction for:

- opening a chat
- scrolling messages
- sending a message
- replying
- reacting
- searching
- navigating back

---

## 15.4 Agent as a Friend Interaction Model

Finder treats the AI agent with the approachable familiarity of a friend on WhatsApp rather than an impersonal utility prompt:

### 1. Contact Header and Topbar
- Replaces static session titles and decorative badges with an interactive contact button.
- Displays the `BotAvatar` with active online status indicator, customizable agent nickname (`agentName`), and dynamic status subtitle.
- Subtitle behavior:
  - When idle: shows informative `"Click here for agent info"` hint.
  - When processing: shows actual real-time streaming status from the backend SSE stream (e.g. `"Searching career opportunities..."`, `"Analyzing resume..."`).
  - No synthetic idle presence: Avoid fabricated "last seen" or artificial idle states.

### 2. Right-Hand Agent Info Drawer
- Clicking the contact header opens a right slide-in drawer (`AgentInfoDrawer`).
- Displays generous 72px `BotAvatar`, inline nickname editor with instant persistence to `localStorage` (`finder_agent_nickname`), and technical LLM runtime card (`openai/gpt-oss-120b` via Groq Cloud).
- Clean scope boundaries:
  - Do not implement custom avatar photo upload (keep lightweight deterministic SVG).
  - Do not implement tone/personality selector dials.
  - Do not embed memory browser in the drawer (reserved for `/settings` sovereign memory).

### 3. WhatsApp-Style Sidebar Conversation Items
- Each conversation item in `SessionHistoryList` displays a 32px `BotAvatar` with deterministic Slush color hashing derived from the session ID.
- Primary text is the customizable Agent nickname; secondary text is the session title.
- Hover reveals a slide-in delete icon button for rapid session management.

### 4. Compact Omnibar Input
- Single-row horizontal input bar with default height 44 to 48px.
- Left-aligned icon-only paperclip for PDF attachment with floating thumbnail chip.
- Center auto-expanding textarea with `"Type a message"` placeholder.
- Right-aligned send button with Slush Violet primary fill.

### 5. Short Empty State Greeting
- Concise, approachable new conversation screen in `/c`.
- Online `BotAvatar` paired with `"Hey, I'm {agentName}"` and `"What can I help you explore today?"`.
- Avoids wall-of-text introductions.

### 6. Strict Exclusion List (Do Not Adopt)
- No avatar photo upload.
- No conversation tone toggles.
- No timestamps or double checkmark ticks on chat bubbles.
- No user or bot avatars attached to individual chat bubbles.

---

# 16. Chat Management

Meta's 2024 WhatsApp design article explicitly documents chat filters.

It states that filters help people focus on and find important conversations faster and describes unread/group filters.

Finder adaptation:

```text
All
Unread
Saved
Jobs
AI
```

Only include filters that correspond to actual Finder data/state.

Do not create decorative filters.

---

# 17. Conversation List

## Required information hierarchy

```text
Avatar
Conversation title
Last message / preview
Timestamp
Unread state
Optional secondary state
```

The exact Finder fields are product-specific.

### Visual priority

```text
Conversation title
    ↓
Unread state / important status
    ↓
Message preview
    ↓
Timestamp
```

Do not make timestamp visually stronger than the conversation name.

---

# 18. Conversation Header

Recommended structure:

```text
[Back/mobile] [Avatar] [Name / context]       [Search] [More]
```

For Finder:

```text
[Back] [Finder icon] Finder AI       [Search] [More]
```

or, for a job-specific conversation:

```text
[Back] [Company] Frontend Engineer   [Search] [More]
```

Do not add WhatsApp-specific call/video controls unless Finder actually provides those capabilities.

---

# 19. Message Model

A message is not merely a bubble.

It has:

```ts
type Message = {
  id: string
  conversationId: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt: string

  status:
    | "submitting"
    | "streaming"
    | "complete"
    | "failed"

  replyTo?: string
  feedback?: "helpful" | "unhelpful" | null
}
```

This is a Finder implementation contract. Messages are immutable once sent (no in-place edit); social emoji reaction arrays are replaced by explicit AI feedback.

---

# 20. Message Grouping

Use temporal/author grouping to reduce visual noise.

Example:

```text
Finder
  message
  message
  message

User
              message
              message
```

Do not render a full avatar/name header on every message in a continuous group.

However, grouping must not make authorship ambiguous.

---

# 21. AI Feedback Actions (Evaluation & Utility)

In an AI career intelligence platform, peer-to-peer social emoji reactions (such as ❤️, 😂, 😮) are replaced with purposeful **AI Evaluation & Utility Actions**.

### Finder Behavior

For AI Messages:
- **Thumbs Up (`helpful`)**: Signals accurate career matching or useful advice (feeds into model alignment).
- **Thumbs Down (`unhelpful`)**: Signals inaccurate, hallucinated, or unhelpful response.
- **Copy**: Copies message text to clipboard.
- **Regenerate**: Re-runs the prompt to generate an alternative response.

For User Messages:
- **Copy**: Copies prompt text to clipboard.
- **Delete**: Removes message from conversation view if supported.

### Touch & Mobile Rule
Do not implement double-tap or long-press emoji gestures. This prevents touch conflicts with native browser text selection (crucial for candidates selecting skill requirements, job titles, or salary details).

---

# 22. Reply-to-Message

Replying to a specific message allows threading context in complex career investigations:

```text
Desktop:
message action → Reply

Mobile:
swipe → Reply
long press → Reply
```

The quoted/referenced message should appear in the composer header before sending.

---

# 23. Message Immutability (No Message Editing)

Finder explicitly **does not support message editing**. Messages are immutable once submitted.

### Architectural Rationale
1. **Context Integrity**: In LLM conversational systems, editing a past user prompt in-place causes prompt-response desynchronization. Downstream AI responses and job matches were generated from the original prompt; altering the prior message in-place leads to context hallucination.
2. **Deterministic History**: Career guidance, resume evaluations, and interview simulations require a clean, verifiable audit trail.
3. **Simplicity**: If a user wants to clarify or change their criteria, they simply submit a new follow-up message in the composer (e.g., *"Actually, focus only on remote roles"*).

---

# 24. Message Context Menu

Finder uses a context-action model tailored for career AI interactions.

Possible actions:

### User message

```text
Reply
Copy
Delete
```

### AI message

```text
Thumbs Up
Thumbs Down
Copy
Regenerate
Retry (if failed)
Reply
```

### Job result

```text
View job
Save job
Copy link
Share
Reply in conversation
```

Only render actions supported by the underlying feature.

---

# 25. Composer

The composer is the primary interaction surface.

## Structure

```text
┌──────────────────────────────────────────────┐
│ +   Message / Ask Finder...              ↑  │
└──────────────────────────────────────────────┘
```

Finder-specific.

### Required states

```text
idle
focused
typing
submitting
streaming
disabled
error
attachment-preview
replying
```

---

# 26. Composer Behavior

## Enter

Desktop:

```text
Enter
→ send
```

## Newline

```text
Shift + Enter
→ newline
```

If the product chooses a different behavior, it must be explicit in the UX copy.

## Send button

Disabled when:

- no content
- not attachable
- no valid action

Enabled when:

- valid message content exists

During AI generation:

```text
Send
→ Stop
```

if the AI backend supports cancellation.

---

# 27. AI Streaming

Finder-specific.

The conversation must visually distinguish:

```text
Generating
    ↓
Streaming content
    ↓
Complete
```

Do not fake a typing animation by delaying already-received text.

Render actual stream state from the application.

---

# 28. AI Message Visual Language

Finder-specific.

AI messages should not be visually identical to human messages.

Recommended:

```text
AI
→ neutral/elevated surface
→ subtle Sui/Slush special accent
→ structured content allowed

User
→ Sui-blue identity surface
```

Do not overuse violet.

Violet is an optional Finder special-state mapping derived from the Slush palette, not an official “AI color.”

---

# 29. Job Result Cards

Finder-specific.

A job result is structured data and should not be forced into a plain text bubble.

Example:

```text
┌──────────────────────────────────────────────┐
│ Frontend Engineer                            │
│ Acme                                        │
│                                              │
│ Remote · Junior                             │
│                                              │
│ React · TypeScript · Next.js                 │
│                                              │
│ ──────────────────────────────────────────── │
│                                      View → │
└──────────────────────────────────────────────┘
```

### Visual rules

Use:

- Finder dark surface
- Slush/Sui accent sparingly
- clear hierarchy
- compact metadata
- one primary action
- optional save action

Do not turn every job card into a rainbow sticker.

---

# 30. Memory UX

Finder-specific.

Memory is a product capability and requires explicit communication.

When Finder uses remembered preferences:

```text
Finder
I used your saved preference for remote
frontend roles in this search.
```

Do not expose internal memory implementation details unless useful.

If memory is unavailable:

```text
Finder
I couldn't access your saved preferences,
so this search uses only this conversation.
```

The UI should distinguish:

```text
conversation context
vs.
persistent memory
```

---

# 31. Web3 / Sui State

Finder is Sui-based.

Web3 state should be present when it is meaningful.

Examples:

```text
Wallet connected
Wallet disconnected
SIWS authenticated
Transaction pending
Transaction confirmed
Transaction failed
```

Do not make the chat interface look like a wallet dashboard.

Use Sui identity through:

- blue accents
- concise wallet state
- recognizable Web3 terminology
- explicit transaction state

---

# 32. Loading States

Use structural loading indicators.

Avoid full-page spinners when only a message is loading.

Examples:

```text
Conversation loading:
message skeletons

AI generating:
small inline activity indicator

Job search:
structured result skeletons

Wallet:
wallet-specific status
```

---

# 33. Empty States

Empty states should explain:

1. What is empty.
2. Why it matters.
3. What the user can do next.

Example:

```text
No conversations yet

Ask Finder about a role, company, or career preference
to start your first conversation.

[Start a conversation]
```

Avoid decorative empty-state illustrations unless they communicate useful product context.

---

# 34. Error States

Every asynchronous action must define an error state.

Example:

```text
Message failed to send

[Retry]
```

AI:

```text
Finder couldn't complete the response.

[Retry]
```

Job search:

```text
Job search temporarily unavailable.

[Try again]
```

Do not expose raw stack traces, provider errors, SQL errors, or API keys.

---

# 35. Offline / Reconnection

WhatsApp's design documentation explicitly discusses designing for varying connectivity.

Finder adaptation:

```text
online
    ↓
degraded
    ↓
offline
    ↓
reconnecting
    ↓
recovered
```

The UI should avoid pretending that a request succeeded if the network state does not confirm success.

Optimistic messages must have a recoverable failure state.

---

# 36. Motion

Meta describes WhatsApp's refreshed illustrations as animated and emphasizes approachable/simple interaction.

Finder should use motion primarily for state communication.

Allowed:

- message appearance
- composer expansion
- AI feedback transition
- context menu
- drawer transition
- AI streaming state
- loading
- success/failure feedback

Avoid:

- perpetual decorative motion
- heavy scroll-triggered animation
- large parallax effects
- excessive spring physics
- animation on every message

---

# 37. Reduced Motion

Respect:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This is a Finder accessibility implementation rule.

---

# 38. Iconography

Meta's 2024 WhatsApp design article documents a rounded, outlined icon style.

Finder may adopt the **principle**:

```text
rounded
outlined
recognizable
simple
```

but must use Finder's icon library rather than WhatsApp's proprietary icons.

Recommended implementation:

- use the existing project icon package if already standardized
- do not mix multiple icon families
- keep stroke widths consistent
- use filled icons only where the icon library defines them

---

# 39. Navigation

WhatsApp's 2024 article documents bottom navigation on Android to place tabs closer to thumbs.

Finder mobile:

```text
Primary navigation should be thumb-accessible.
```

Possible:

```text
Home
Chats
Jobs
Profile
```

Only use tabs that correspond to actual Finder destinations.

Desktop can use sidebar navigation.

---

# 40. Chat Filters

Use filter controls above the conversation list where appropriate.

Example:

```text
All | Unread | Jobs | AI
```

Use pill geometry from the Slush visual language.

Behavior should follow conventional filtering:

```text
inactive
active
pressed
disabled
```

The selected state must not rely on color alone.

---

# 41. Accessibility

## 41.1 Keyboard

Required:

- Tab navigation
- Enter activation
- Escape closes transient surfaces
- Arrow keys where the component pattern requires them
- keyboard-accessible message actions

---

## 41.2 Focus

Every interactive component requires a visible focus state.

Recommended:

```text
focus-visible
→ Sui Blue outline/ring
```

Do not remove browser focus without replacing it with an equally visible indicator.

---

## 41.3 Color

Never communicate:

```text
success = green only
error = orange only
warning = yellow only
```

Use:

```text
color
+
icon
+
text/status
```

---

## 41.4 Contrast

Sui's diagram documentation explicitly applies WCAG thresholds to its visual artifacts and warns that Sui Blue 500 is not sufficient for small body text on white, recommending Sui Blue 600 for that case.

Finder must separately validate application text contrast against its dark surfaces.

Do not assume that an on-brand color is automatically accessible.

---

# 42. Component Architecture

Recommended component hierarchy:

```text
components/
├── app-shell/
│   ├── AppShell
│   ├── DesktopSidebar
│   └── MobileNavigation
│
├── conversations/
│   ├── ConversationSidebar
│   ├── ConversationSearch
│   ├── ConversationFilters
│   ├── ConversationList
│   ├── ConversationListItem
│   └── ConversationHeader
│
├── messages/
│   ├── MessageTimeline
│   ├── MessageGroup
│   ├── MessageBubble
│   ├── MessageActions
│   ├── MessageFeedback
│   ├── MessageReplyPreview
│   ├── MessageStatus
│   └── MessageContextMenu
│
├── composer/
│   ├── MessageComposer
│   ├── ComposerInput
│   ├── ComposerActions
│   └── ReplyComposerState
│
├── ai/
│   ├── AIMessage
│   ├── AIStreamingIndicator
│   ├── AIErrorState
│   └── AIRegenerateAction
│
├── jobs/
│   ├── JobResultCard
│   ├── JobMetadata
│   ├── JobSkills
│   └── JobActionBar
│
└── wallet/
    ├── WalletStatus
    ├── AuthenticationState
    └── TransactionState
```

---

# 43. Component State Contract

Each interactive component should explicitly define:

```text
default
hover
focus-visible
pressed
selected
disabled
loading
success
error
```

Not every component needs every state.

Example:

```text
Button:
default
hover
focus
pressed
disabled
loading

Filter:
default
hover
focus
selected
disabled

Message:
default
hover
selected
submitting
streaming
complete
failed
```

---

# 44. Tailwind Class Strategy

## Bad

```tsx
<div className="
  bg-[#111419]
  rounded-[17px]
  px-[13px]
  border-[rgba(255,255,255,.11)]
">
```

## Better

```tsx
<div className="
  bg-finder-surface-1
  rounded-lg
  px-4
  border
  border-finder-border-default
">
```

## Best for reusable semantic components

```tsx
<MessageBubble variant="assistant" />
```

with the component owning the semantic classes.

---

# 45. Tailwind v4 Custom Utilities

Tailwind v4 supports `@utility`.

Example:

```css
@utility finder-focus-ring {
  outline: 2px solid var(--action-primary);
  outline-offset: 2px;
}
```

Use this for repeated semantic behavior.

Source:

https://tailwindcss.com/docs/functions-and-directives

Do not create custom utilities for trivial one-off combinations that can already be expressed with normal utilities.

---

# 46. Tailwind v4 Custom Variants

Tailwind v4 supports `@custom-variant`.

Example:

```css
@custom-variant finder-disabled (&:where([data-disabled="true"] *));
```

Use custom variants only when there is a real recurring state model.

Do not create variants for every component.

Source:

https://tailwindcss.com/docs/functions-and-directives

---

# 47. Responsive Breakpoints

Use Tailwind's responsive variants.

Do not invent arbitrary breakpoint values unless the product actually requires them.

Primary layout behavior:

```text
mobile
→ conversation-focused

tablet
→ adaptive split layout

desktop
→ persistent conversation list + active conversation
```

The exact breakpoint values should remain the project's existing Tailwind configuration unless there is a documented product requirement to change them.

---

# 48. Scroll Behavior

Conversation timeline:

```text
new conversation
→ scroll to latest message

user reading older messages
→ do not forcibly scroll

new message while user is away from bottom
→ show "new messages" affordance

user returns to bottom
→ dismiss affordance
```

AI streaming:

```text
if user is already near bottom:
    follow stream

if user intentionally scrolled away:
    do not steal scroll position
```

This is a Finder interaction requirement.

---

# 49. Message Status

Finder message status represents the request and streaming lifecycle rather than peer-to-peer delivery receipts:

```text
submitting   → Message or prompt being transmitted over HTTP/SSE
streaming    → Response tokens actively streaming into timeline
complete     → Transmission and generation completed successfully
failed       → Network error or service degradation (shows Retry)
```

### No P2P Delivery Ticks
Do not implement WhatsApp-style single or double check marks (ticks); delivery ticks have no semantic relevance in human-to-AI interactions.

---

# 50. Optimistic UI

Allowed for actions where failure can be reconciled:

```text
send message
feedback (thumbs up/down)
save job
```

Pattern:

```text
optimistic
    ↓
server confirmation
    ↓
confirmed
```

or:

```text
optimistic
    ↓
server failure
    ↓
rollback / retry
```

Do not silently swallow failures.

---

# 51. Search

Finder conversation search should use a familiar messaging pattern:

```text
open search
→ enter query
→ results
→ select result
→ jump to message
```

The search UI must preserve the conversation context.

Do not navigate to a generic search page if a contextual message jump is more appropriate.

---

# 52. Attachments

Meta's WhatsApp design article documents an expandable attachment tray on iOS instead of a full-screen menu.

Finder can use the same interaction principle:

```text
composer
  ↓
attachment trigger
  ↓
compact/expandable tray
  ↓
available Finder actions
```

Only expose supported attachment types.

For example:

```text
Resume
Job link
Document
Image
```

if those capabilities exist.

Source:

https://www.meta.com/design-at-meta/blog/whatsapp-user-interface-update/

---

# 53. Job Context in Conversations

Finder's central differentiator is that a conversation can contain job context.

A message may reference:

```text
Job
Company
Role
Location
Seniority
Skills
Salary
Source
Match information
```

Do not put all metadata inside the message bubble.

Use structured cards.

---

# 54. AI + Job Conversation Example

```text
User:
Find me junior frontend roles using React and Next.js.

Finder:
I found several roles matching those preferences.

┌──────────────────────────────────────┐
│ Frontend Engineer                    │
│ Example Company                      │
│ Remote · Junior                      │
│                                      │
│ React · Next.js · TypeScript         │
│                                      │
│ [View job]       [Save]              │
└──────────────────────────────────────┘
```

Visual ownership:

```text
Conversation shell → WhatsApp-inspired
Message interaction → WhatsApp-inspired
Card language → Slush/Finder
Accent → Sui/Slush
Content → Finder
```

---

# 55. Brand / Marketing Surfaces

The full Slush marketing visual language may be used selectively outside the dense chat application.

Appropriate places:

- landing page hero
- hackathon presentation
- project marketing page
- onboarding illustration
- feature announcement

Potentially appropriate:

- Plus Jakarta Sans bold display type
- larger color fields
- Slush palette
- decorative sticker treatment

Not appropriate by default:

- message timeline
- dense search results
- settings
- forms
- tables
- wallet transaction history

---

# 56. Application UI vs Marketing UI

Use this separation:

```text
MARKETING
─────────
More Slush
More expressive
Plus Jakarta Sans Display (Bold)
Large color fields
Decorative elements

APPLICATION
───────────
More Sui
More neutral
Plus Jakarta Sans UI
Dense messaging layout
Functional accents

MESSAGING
─────────
WhatsApp-inspired behavior
Finder visual identity

AI / JOB
────────
Finder-specific semantics
```

---

# 57. Anti-Patterns

## 57.1 WhatsApp clone

Bad:

```text
WhatsApp green
WhatsApp logo
WhatsApp bubbles
WhatsApp icons
WhatsApp background
```

Good:

```text
WhatsApp interaction patterns
+
Finder/Sui/Slush visual identity
```

---

## 57.2 Slush landing page inside the chat

Bad:

```text
overly giant display text
3D ribbons
stickers
rainbow cards
```

Good:

```text
Slush palette
rounded geometry
Plus Jakarta Sans typography
selective expressive accents
```

---

## 57.3 Color overload

Bad:

```text
blue + mint + purple + yellow + orange
on every component
```

Good:

```text
neutral surface
+
one primary identity color
+
semantic accent only when needed
```

---

## 57.4 Arbitrary radius

Bad:

```css
border-radius: 17px;
```

Good:

```text
rounded-lg
rounded-xl
rounded-2xl
rounded-pill
```

---

## 57.5 Arbitrary colors

Bad:

```css
color: #38A7FF;
```

Good:

```text
Sui Blue 500
```

or:

```text
semantic action-primary
```

---

# 58. Visual Hierarchy

Priority order:

```text
1. Current conversation / primary task
2. Message content
3. Primary action
4. Job information
5. Conversation metadata
6. Secondary actions
7. Decorative identity
```

Never allow brand decoration to outrank the actual job or conversation content.

---

# 59. Z-Index System

Use a small fixed hierarchy.

```text
base
sticky
dropdown
popover
modal
toast
```

Example Finder tokens:

```css
@theme {
  --z-index-base: 0;
  --z-index-sticky: 10;
  --z-index-dropdown: 20;
  --z-index-popover: 30;
  --z-index-modal: 40;
  --z-index-toast: 50;
}
```

Do not create:

```text
z-[99999]
z-[100000]
```

without a documented architectural reason.

---

# 60. Overlay Behavior

Dropdowns:

- anchor to triggering control
- close on outside interaction
- close on Escape
- preserve keyboard focus

Dialogs:

- trap focus where appropriate
- restore focus on close
- provide accessible title
- provide explicit dismissal

Context menus:

- open near the target
- remain inside viewport
- support keyboard interaction

---

# 61. Toasts

Use toasts for transient confirmation.

Good:

```text
Job saved
Message copied
Wallet connected
```

Avoid:

```text
Your operation was successfully completed!
```

Keep copy concise.

---

# 62. Copywriting Principles

Finder UI copy should be:

- concise
- explicit
- action-oriented
- human-readable
- non-technical unless technical detail is required

Avoid:

```text
Execute operation
```

Prefer:

```text
Save job
```

Avoid:

```text
Authentication process unsuccessful
```

Prefer:

```text
Couldn't sign in
```

---

# 63. AI Copy

AI should not expose internal system terminology.

Avoid:

```text
The retrieval pipeline returned zero canonical jobs.
```

Prefer:

```text
I couldn't find matching jobs right now.
```

Technical details belong in diagnostics, not primary user copy.

---

# 64. Accessibility + AI

AI status must be available to assistive technologies.

Examples:

```text
Finder is generating a response.
```

```text
Finder finished responding.
```

```text
Finder couldn't complete the response.
```

Do not rely only on an animated typing indicator.

---

# 65. Performance

Do not sacrifice rendering performance for visual effects.

Avoid:

- large animated SVGs in the message list
- unnecessary blur filters
- perpetual background animations
- heavy scroll listeners
- rendering every context menu at once
- mounting every attachment preview immediately

Prefer:

- CSS transitions
- lazy rendering
- virtualization when message volume requires it
- stable keys
- incremental AI rendering
- memoized expensive components

---

# 66. Testing Requirements

Every new messaging component should have:

### Unit tests

- state transitions
- formatting
- event handlers
- disabled behavior

### Component tests

- keyboard behavior
- accessible labels
- visual states
- error states

### Integration tests

- send message
- reply
- AI feedback (thumbs up/down)
- retry
- streaming
- job card interaction
- search

### Responsive tests

At minimum:

```text
mobile
tablet
desktop
```

---

# 67. Visual QA Checklist

Before merging a UI change:

## Identity

- [ ] Sui/Slush identity is visible
- [ ] WhatsApp green is not used as Finder's brand color
- [ ] No WhatsApp logo/assets copied
- [ ] Slush decorative language is used selectively

## Typography

- [ ] Plus Jakarta Sans loaded and applied across display and UI
- [ ] Clear weight hierarchy established (Medium 500, SemiBold 600, Bold 700)
- [ ] Fallback stack works seamlessly
- [ ] Body text is readable and comfortable

## Tokens

- [ ] no arbitrary colors
- [ ] no arbitrary spacing
- [ ] no arbitrary radius
- [ ] semantic tokens used
- [ ] Tailwind v4 `@theme` remains source of token utilities

## Messaging

- [ ] conversation list is understandable
- [ ] message grouping is clear
- [ ] reply behavior works
- [ ] AI feedback (thumbs up/down) works
- [ ] message immutability preserved (no in-place edit)
- [ ] failed messages can be retried
- [ ] AI streaming state is clear

## Accessibility

- [ ] keyboard navigation
- [ ] focus-visible
- [ ] accessible names
- [ ] state not communicated by color alone
- [ ] reduced motion

## Mobile

- [ ] thumb-accessible primary navigation
- [ ] composer remains accessible
- [ ] message actions are touch-friendly
- [ ] context menus remain inside viewport

---

# 68. Agent Implementation Workflow

When an AI coding agent changes Finder UI:

## Step 1 — Read

Read:

```text
docs/design/finder-design-system.md
```

before modifying UI.

## Step 2 — Identify source category

For every proposed visual/interaction change:

```text
Sui?
Slush?
WhatsApp?
Finder?
```

## Step 3 — Check existing tokens

Search the project for:

```text
@theme
--color-
--radius-
--spacing
```

before creating a new token.

## Step 4 — Implement semantic component

Prefer:

```tsx
<MessageBubble variant="assistant" />
```

over repeatedly composing low-level classes.

## Step 5 — Test states

Test:

```text
default
hover
focus
pressed
disabled
loading
error
```

where applicable.

## Step 6 — Test responsive behavior

Verify:

```text
mobile
tablet
desktop
```

## Step 7 — Verify source compliance

Ask:

> Did this change accidentally turn Finder into a WhatsApp clone?

and:

> Did this change accidentally turn the messaging UI into a Slush marketing page?

If yes, revise.

---

# 69. Recommended Documentation Architecture

The design documentation should be separated by concern.

```text
Finder/
├── AGENTS.md
├── README.md
│
├── docs/
│   ├── design/
│   │   ├── finder-design-system.md
│   │   ├── tokens.md
│   │   ├── messaging-patterns.md
│   │   └── ui-writing.md
│   │
│   ├── architecture/
│   ├── api/
│   ├── database/
│   ├── workflows/
│   └── decisions/
│
├── .agents/
└── src/
```

This document can initially remain the central source of truth.

When it becomes too large, split it into:

```text
finder-design-system.md
    ↓
tokens.md
messaging-patterns.md
ui-writing.md
```

---

# 70. AGENTS.md Contract

Add this to the project-level `AGENTS.md`:

```md
## Design System

Finder uses a dark-only Sui/Slush-inspired visual system with
WhatsApp-inspired conversational interaction patterns.

The authoritative design specification is:

`docs/design/finder-design-system.md`

Before modifying Finder UI:

1. Read the design-system document.
2. Use existing design tokens.
3. Preserve the Sui/Slush visual identity.
4. Use WhatsApp only as an interaction-pattern reference.
5. Do not copy WhatsApp branding, assets, or exact visual identity.
6. Do not turn the application UI into Slush's marketing/landing-page style.
7. Keep AI, job, wallet, and memory semantics Finder-specific.
```

---

# 71. Source Matrix

| Topic | Source | Status |
|---|---|---|
| Sui core diagram palette | Sui Docs | Official |
| Sui Blue 500 `#298DFF` | Sui Docs | Official |
| Sui Blue 600 `#1759C4` | Sui Docs | Official |
| Sui diagram typography | Sui Docs | Official |
| TWK Everett brand typeface | Sui Docs | Official |
| Slush colors | Slush Brand Assets | Official |
| Finder typography | Google Fonts (SIL OFL) | Plus Jakarta Sans standardized |
| Slush 4px scale | Refero | Reference |
| Slush 20–40px cards | Refero | Reference |
| Slush giant display scale | Refero | Reference |
| Slush component examples | Refero | Reconstruction |
| WhatsApp Fresh/Approachable/Simple | Meta Design | Official |
| WhatsApp darker dark mode | Meta Design | Official |
| WhatsApp neutral-color strategy | Meta Design | Official |
| WhatsApp rounded outlined icons | Meta Design | Official |
| WhatsApp chat filters | Meta Design | Official |
| WhatsApp attachment tray | Meta Design | Official |
| WhatsApp bottom navigation | Meta Design | Official |
| AI message feedback | Finder / AI standard | Thumbs up/down, Copy, Regenerate |
| Message reply interaction | Meta messaging documentation | Adapted |
| Message edit interaction | Finder product rule | Excluded (Message Immutability) |
| Finder AI semantics | Finder | Product decision |
| Finder job cards | Finder | Product decision |
| Finder dark palette | Finder | Product decision |
| Finder message state model | Finder | Product decision |
| Finder Sui/Slush-to-dark adaptation | Finder | Product decision |

---

# 72. Primary References

## Sui

Sui Technical Diagram Standards:

https://docs.sui.io/references/contribute/diagram-standards

---

## Slush

Slush official Brand Assets:

https://slush.app/brand-assets

---

## Slush Reference Reconstruction

Refero Slush Style:

https://styles.refero.design/style/8b6b547f-a357-4f1b-9842-4579c62dd42b

Important:

This source explicitly identifies itself as a reconstruction/reference. Do not treat it as official Slush source code or internal design-system documentation.

---

## WhatsApp Design

Meta Design at Meta — WhatsApp UI update:

https://www.meta.com/design-at-meta/blog/whatsapp-user-interface-update/

---

## WhatsApp Brand

Meta WhatsApp Brand Resource Center:

https://www.meta.com/brand/resources/whatsapp/whatsapp-brand/

---

## WhatsApp Interaction Model Reference

Meta Design & Messaging:

https://about.fb.com/news/2022/01/updates-to-end-to-end-encrypted-chats-messenger/

https://about.fb.com/news/2022/04/our-vision-for-communities-on-whatsapp/

Note: WhatsApp message editing and social emoji reactions are explicitly excluded from Finder in favor of LLM message immutability and binary AI evaluation feedback.

---

## Tailwind CSS v4

Theme variables:

https://tailwindcss.com/docs/theme

Dark mode:

https://tailwindcss.com/docs/dark-mode

Colors:

https://tailwindcss.com/docs/colors

Functions/directives:

https://tailwindcss.com/docs/functions-and-directives

Color scheme:

https://tailwindcss.com/docs/color-scheme

---

# 73. Final Design Rule

The most important rule in this document is:

```text
                 FINDER
                   │
       ┌───────────┴───────────┐
       │                       │
   SUI / SLUSH              WHATSAPP
   VISUAL SYSTEM          INTERACTION MODEL
       │                       │
       │                       │
       └───────────┬───────────┘
                   │
             FINDER SEMANTICS
                   │
          ┌────────┼─────────┐
          │        │         │
          AI      JOBS     SUI/WALLET
```

Or, in one sentence:

> **Use Sui and Slush to make Finder look like it belongs to the Sui ecosystem; use WhatsApp to make Finder's conversations behave like a mature messaging product; use Finder's own product semantics to make it a job-discovery AI application rather than a clone of either.**

That is the design-system boundary every future implementation should preserve.
