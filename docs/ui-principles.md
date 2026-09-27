# UI Principles

Finder adheres to user interface principles optimized for career intelligence and focused exploration.

---

## 1. Single Primary Action per View

Every screen must present exactly one obvious primary action to avoid cognitive overload:

| View                           | Primary Action                                            | Secondary Options                                     |
| :----------------------------- | :-------------------------------------------------------- | :---------------------------------------------------- |
| **Landing / Home (`/`)**       | Upload Resume or ask initial prompt via `OmniPromptInput` | Click quick-action pill suggestion                    |
| **Chat Timeline (`/c/[id]`)**  | Read analysis insights or ask follow-up questions         | Click "Ask Copilot about this role" or "View Details" |
| **Recommended Jobs (`/jobs`)** | Open job detail drawer to evaluate fit                    | Filter by match level, location, or experience        |
| **Job Drawer**                 | Click "Apply Now" (redirect to employer portal)           | Close drawer                                          |

---

## 2. Accessible Components & Keyboard Navigation

- **WAI-ARIA Dialogs & Drawers**: Modals and side sheets (e.g. Job Detail Drawer in `JobsView.tsx`) must implement:
  - `role="dialog"` and `aria-modal="true"`.
  - Proper `aria-labelledby` and `aria-describedby` associations.
  - Active focus trapping (cycling focus within the drawer via `Tab` / `Shift+Tab`).
  - Dismissal via `Escape` key and click-outside backdrop.
  - Automatic focus restoration to the trigger element when closed.
- **Form Controls**: All inputs must have accessible labels or `aria-label` attributes.

---

## 3. Skeletons over Spinners

When content is being loaded or evaluated:

- Use content-matching pulse skeletons (e.g., `JobsPageSkeleton.tsx`, `ChatTimelineSkeleton.tsx`) rather than generic circular spinners.
- When AI processing is underway, provide descriptive status feedback (`"Extracting technical skills..."`, `"Analyzing profile & discovering matched roles..."`).

---

## 4. Educational Empty States

Empty states should never leave the user at a dead end. Every empty state must explain **why** it is empty and provide a clear call to action (e.g., `"No matched jobs yet. Upload your CV in a chat session to get matched with jobs."` with a `"Start a chat"` button).
