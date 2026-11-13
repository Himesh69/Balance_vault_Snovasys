# BalanceVault — UI Redesign Spec

Audience: coding agent redoing the React frontend. Read fully before touching code.
Scope: visual layer only. Do NOT change API routes, Prisma schema, auth logic, RBAC rules, or Redis rate limiting. Keep all existing routes, props and data flow working.

---

## 1. Design intent

BalanceVault is a **ledger you can prove**. The UI should feel like a well-kept accounting book: ruled lines, tabular numbers, calm paper tones, quiet authority. Not a startup landing page. Not a crypto dashboard.

One-sentence test: *"Would this look at home as a printed bank statement redesigned by a good editorial designer?"* If yes, ship. If it looks like a Dribbble SaaS shot, redo.

Keywords: ledger, paper, ink, rule lines, mono figures, restrained, exact.

---

## 2. Anti-slop rules (hard bans)

The agent must NOT use any of the following:

- Floating pill/island navigation bars, floating bottom tab bars, floating action buttons.
- Glassmorphism, backdrop-blur panels, frosted cards.
- Purple/indigo-to-pink/blue gradients. No gradients on text. No gradient buttons. No gradient blobs, orbs, mesh backgrounds, or glow effects.
- Big soft drop shadows on cards (`shadow-xl`, `shadow-2xl`). Max allowed shadow: none, or a 1px hairline-equivalent.
- Every element as a rounded-2xl card with padding in a 3-column grid of identical tiles.
- Icon-in-a-colored-circle above every feature/stat.
- Emoji in UI, "Welcome back 👋", sparkles, rocket icons.
- Hero sections with centered headline + two buttons + "trusted by" strip.
- Pill-shaped badges everywhere, pill-shaped buttons, fully rounded avatars as decoration.
- Skeleton shimmer gradients that sweep (use static muted blocks or a simple opacity pulse at most).
- Hover effects that lift/scale cards (`hover:-translate-y-1`, `hover:scale-105`).
- Dark mode with neon accents. (Dark mode is optional, see §11.)
- Lorem-ish marketing copy: "Seamless", "Empower", "Unlock", "Supercharge", "Effortless".
- Inter + Tailwind default gray/slate/indigo palette untouched.
- Dashboard of 4 stat cards with sparkline + percent-up-green-arrow as the first thing.

If a component the agent is about to write matches anything above, replace it with the alternative in this spec.

---

## 3. Color system

Warm paper neutrals, deep green ink accent, brass secondary. Define as CSS variables / Tailwind theme tokens. Do not use raw hex in components.

### Light (primary theme)

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#F5F2EA` | App background |
| `--paper-raised` | `#FBF9F4` | Panels, table bodies, inputs |
| `--paper-sunk` | `#ECE8DD` | Table header rows, sidebar background, zebra |
| `--ink` | `#1C211E` | Primary text |
| `--ink-soft` | `#4A524D` | Secondary text |
| `--ink-faint` | `#7C847E` | Placeholders, meta, disabled text |
| `--rule` | `#D6D0C2` | Hairline borders, row dividers |
| `--rule-strong` | `#1C211E` | Double rules, table top/bottom borders, focus-adjacent emphasis |
| `--green` | `#1F4D3F` | Primary actions, links, active nav marker |
| `--green-hover` | `#173A30` | Primary hover |
| `--green-wash` | `#DCE7E0` | Subtle selected/credit background |
| `--brass` | `#A87B2A` | Secondary accent, pending states, highlights |
| `--brass-wash` | `#F0E4C8` | Pending background |
| `--oxblood` | `#8A2E2A` | Destructive, debit emphasis, errors |
| `--oxblood-wash` | `#F1DAD7` | Error background |
| `--slate-blue` | `#2F4A6B` | Info, rare use (audit "read" events) |

Contrast: body text on paper ≥ 7:1, all interactive text ≥ 4.5:1. Verify `--ink-faint` only used for non-essential text on `--paper`.

Semantic mapping:
- Credit / success / verified → `--green`
- Debit / error / rejected / suspended → `--oxblood`
- Pending / awaiting review → `--brass`
- Info / system → `--slate-blue`
- Never rely on color alone: pair with a text label or glyph (see §8).

### Dark (optional, phase 2)
Only if time allows: `--paper #141816`, `--paper-raised #1A1F1C`, `--ink #E9E5DA`, keep green/brass desaturated slightly. No pure black.

---

## 4. Typography

- **Headings / display:** `Newsreader` (or `Fraunces` at low optical-size/soft=0 if Newsreader unavailable). Weight 500–600. Used for page titles, section titles, large balance figures label, auth screen title.
- **Body / UI:** `IBM Plex Sans`, 400/500/600.
- **Figures, IDs, hashes, timestamps, account numbers:** `IBM Plex Mono`, with `font-variant-numeric: tabular-nums`. All money values and ledger columns use mono, right-aligned.
- Load via self-hosted or Google Fonts with `font-display: swap`. Include fallbacks: `Georgia, serif` / `system-ui, sans-serif` / `ui-monospace, monospace`.

Scale (px / line-height):
- Page title: 32/38 serif
- Section title: 22/28 serif
- Subsection / panel title: 16/22 sans 600, uppercase NOT used
- Body: 15/24 sans
- Table text: 14/20
- Meta/caption: 12.5/18, `--ink-soft`
- Small caps label (sparingly, e.g. table column headers): 11.5px, letter-spacing 0.06em, uppercase, `--ink-soft`, sans 600
- Large balance figure: 40/44 mono, 500

Never center-align body text. Left-align everything except numeric columns (right) and auth card title area.

---

## 5. Layout & spacing

- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64.
- Border radius: **2px** on inputs, buttons, panels, badges. 0 on tables. No radius above 4px anywhere. Avatars (if any): square 28px with initials, 2px radius, no circles.
- Borders: 1px `--rule`. Emphasis rules: 1px `--rule-strong` or a double rule (`border-top: 3px double var(--rule-strong)`) for ledger totals and table footers.
- No box-shadows. Separation comes from rules, background steps (`paper` → `paper-raised` → `paper-sunk`) and whitespace.
- Max content width 1120px for data pages, 440px for auth forms. Page gutters 32px desktop / 16px mobile.

### App shell
- **Left rail**, fixed, full height, flush to the viewport edge (NOT floating, no margin, no rounded outer corners), 232px wide, `--paper-sunk` background, 1px `--rule` right border.
  - Top: wordmark "BalanceVault" in serif 20px with a small square ledger mark (2-line ruled square, SVG, 20px). No logo gradient.
  - Nav items: text-only rows 40px tall, 14px sans. Active item: 3px left bar in `--green`, `--paper-raised` background, weight 600. No pill highlight. Optional 16px outline icon (Lucide, stroke 1.5) at left; icons not required.
  - Group labels in small caps (e.g. ACCOUNT, ADMINISTRATION). Admin group visible only to admin role.
  - Bottom: current user name, role label in mono small, "Sign out" text button. Separated by a rule.
- **Top strip** (not floating): 56px, same `--paper` background, bottom 1px rule. Left: breadcrumb in plain text (`Accounts / 0042-118`). Right: nothing decorative. No search bar unless the feature already exists. No notification bell unless it exists.
- Mobile (<900px): rail becomes a full-width top bar with a text "Menu" button that opens a full-height drawer from the left with the same rail content. NO bottom tab bar.

---

## 6. Components

### Buttons
- Primary: `--green` bg, `--paper-raised` text, 2px radius, 40px height, 14px/600, padding 0 16px. Hover `--green-hover`. Focus: 2px outline `--green` offset 2px.
- Secondary: transparent, 1px `--ink` border, `--ink` text. Hover `--paper-sunk` bg.
- Tertiary/text: `--green` text, underline on hover, no bg.
- Destructive: `--oxblood` bg or outline variant. Always requires confirm dialog for suspend/reject/delete.
- Disabled: `--paper-sunk` bg, `--ink-faint` text, no pointer.
- Loading: text swaps to "Working…" with a 14px simple rotating ring; button width stays fixed.
- No icon-only floating buttons. Icon buttons in tables must have visible tooltip + aria-label.

### Inputs
- 40px height, `--paper-raised` bg, 1px `--rule` border, 2px radius, 15px text.
- Label above, 13px 600, never floating-label. Helper text below in 12.5px `--ink-soft`. Error text in `--oxblood` with a leading "Error:" word for non-color cue, border turns `--oxblood`.
- Focus: border `--green`, plus 2px `--green-wash` outer ring (solid, not blurred).
- Money input: mono font, right-aligned, currency code as fixed text suffix inside the field.
- Password field: "Show" / "Hide" text toggle, not an eye icon.

### Tables (the core component — ledger style)
- No outer card or rounded container. Table sits directly on page with a 2px `--rule-strong` top border and a 1px bottom border.
- Header row: `--paper-sunk`, small-caps column labels, 1px bottom rule.
- Rows: 44px, 1px `--rule` bottom border, no zebra by default; hover `--paper-sunk` at 60%.
- Numeric columns right-aligned mono, tabular-nums. Debits shown as `−1,250.00` in `--oxblood`; credits `+1,250.00` in `--green`. Always include the sign glyph.
- Running balance column in ledger views, bold, with a 3px double rule above the closing balance row.
- Row expand for detail: inline expanded row with left 3px `--rule-strong` bar, not a modal.
- Pagination: text row "Showing 1–25 of 312" + "Previous / Next" text buttons. No numbered pill pagination.
- Empty state: one serif sentence + one action. Example: "No entries yet. Entries appear here once the account moves money." No illustration, no mascot.
- Sticky header on long tables.

### Badges / status
- Rectangular, 2px radius, 12px mono uppercase, 1px border in status color, `*-wash` background, text in status color. Include a leading 6px square glyph (■ solid for final states, □ outline for pending).
- Labels: `VERIFIED`, `PENDING`, `REJECTED`, `SUSPENDED`, `ADMIN`, `HOLDER`.

### Panels (replace "cards")
- Use sparingly. A panel is `--paper-raised` bg, 1px `--rule` border, 2px radius, 24px padding, with a serif section title and a rule beneath it. Never nest panels. Never put a shadow on them. Do not make grids of 3–4 identical panels.

### Dialogs
- Centered, 480px max, `--paper-raised`, 1px `--ink` border, 2px radius, no shadow; backdrop is flat `rgba(28,33,30,0.45)` with NO blur. Title serif 20px. Buttons right-aligned, primary last. Destructive dialogs restate the target (e.g. user email) in mono.

### Toasts
- Top-right is banned by default; use inline banners at top of the page content: full-width, 1px border, status wash bg, text + dismiss "Close" text button. Success auto-dismiss 5s; errors persist.

### Tabs
- Underline tabs only: text, 2px `--green` underline on active, 1px rule beneath the whole row. No pill tabs, no segmented controls floating over content.

### Stepper (onboarding)
- Vertical numbered list on the left (or top row on mobile): numerals in mono "01 02 03", the current step bold with a 3px left bar, done steps with "Done" text in `--green`, upcoming in `--ink-faint`. No circles-with-checkmarks connected by lines.

### Loading
- Page: static `--paper-sunk` blocks matching layout, opacity pulse 1.2s ease max. Inline: "Loading…" text.

### Icons
- Lucide outline, 16px, stroke 1.5, `currentColor`. Use only where it replaces a word the user doesn't need (e.g. external link, copy). Prefer text labels. No colored icon circles.

---

## 7. Screens

### 7.1 Login / Register (auth)
- Full-page `--paper` background. Single column 440px, left-aligned, vertically offset ~14vh from top (not dead centre).
- Above form: wordmark + a one-line serif tagline: "Money movement with a ledger you can prove." (use exactly this).
- Form sits in a panel with a 3px `--rule-strong` top border (like a document header). No illustration side-panel, no gradient hero.
- Register: fields stacked; password rules shown as a plain checklist in text ("At least 12 characters — met / not yet met"), with text states, not just colors.
- Footer links as text: "No account? Open one." / "Already registered? Sign in."
- Rate-limit (429 from Redis limiter): inline banner "Too many attempts. Try again in {n} seconds." with live countdown in mono. Disable submit during countdown.

### 7.2 Onboarding (account-holder)
- Vertical stepper (§6) + form content on right, max 560px.
- Steps match whatever the existing onboarding workflow has; do not invent steps. Each step has a serif title, one line of plain instruction, fields, and "Save and continue" / "Back" text.
- Final state screen "Submitted for review": shows a reference ID in mono, status badge `PENDING`, and a ruled summary list (label ... value) of what was submitted. No confetti, no big checkmark illustration.
- Rejected state: oxblood banner with admin's reason, and a "Revise and resubmit" primary action.

### 7.3 Account overview (holder dashboard)
- Page title in serif: "Account 0042-118" (mono for the number) + status badge.
- Top block: **one** large balance statement, not four stat cards:
  - small-caps label "AVAILABLE BALANCE", 40px mono figure, beneath it in 13px `--ink-soft`: "As of 13 Nov 2026, 11:59 IST".
  - To the right, a 2-column definition list (label/value with dotted leader lines, like a statement): Account type, Opened, Currency, Last entry.
- Below: "Recent entries" ledger table (last 10) with link "View full ledger →" as text link.
- Primary actions row (Deposit / Transfer / Withdraw — only whichever exist) as normal buttons placed under the balance, left-aligned. Not floating.

### 7.4 Ledger / transactions
- Filters as a single flat row above the table: date range, type select, search, "Apply" and "Reset" text buttons. No filter chips with X pills.
- Columns: Date (mono), Reference (mono, truncated with copy text button), Description, Debit, Credit, Balance.
- Footer rule with period totals (double rule above).
- Export, if it exists, as secondary button "Export CSV".
- Row detail inline expand shows full reference, counterparty, created-by, and ledger entry hash/sequence number if the backend exposes it (provability is the product's theme: surface it in mono, labelled "Entry ID").

### 7.5 Transfer / money-movement forms
- Single column 520px form in a panel. Amount field first and largest (mono 24px). Show "Review" step before commit: a ruled summary table (From, To, Amount, Fee, Reference) and a "Confirm transfer" primary button. After success, show receipt-style block with entry ID and timestamp, and a "Back to account" text link.
- Insufficient funds / validation errors: inline field error + banner summary, plain language, no exclamation marks.

### 7.6 Admin — User management
- Page title "Users". Underline tabs: All / Account holders / Admins / Suspended.
- Dense ledger-style table: Name, Email, Role badge, Status badge, Created, Last active (mono), actions column with text buttons "View", "Suspend" (destructive, confirm dialog).
- Role change via select inside a confirm dialog, never inline silent change.
- User detail: two-column layout — left ruled definition list, right "Recent activity" mini audit table.

### 7.7 Admin — Onboarding queue
- Table of submissions: Reference, Applicant, Submitted (mono), Status badge, Assigned to. Row click opens a detail view (route, not modal).
- Detail view: left column = submitted data as a ruled definition list; right column = decision panel with "Approve" (primary) and "Reject" (destructive outline) and a required reason textarea for reject. Show previous decisions beneath as a mini timeline: vertical 1px rule with square markers (not circles), mono timestamps.

### 7.8 Admin — Audit log
- This is the flagship page; make it the most "ledger" screen.
- Table: Timestamp (mono, UTC with local on hover/title), Actor (email), Action (mono code like `user.suspend`), Target (mono), IP (mono), Result badge. Optional expandable row showing JSON payload in a mono `<pre>` on `--paper-sunk`, 13px, with "Copy" text button.
- Filters row: actor, action, date range, result. Persist in URL query string.
- Footer note in 12.5px: "Audit entries are append-only." (only if true in backend — verify before adding).

### 7.9 Error / 403 / 404 / 429 / 500 pages
- Left-aligned serif headline + one sentence + one text link home. Show the HTTP code in large mono 64px `--rule` colored behind nothing fancy. No illustrations.
- 403 copy: "You don't have access to this page." Include current role in mono.

---

## 8. Accessibility
- WCAG 2.2 AA minimum. Visible focus on every interactive element (2px outline, offset 2px).
- Never color-only status: always text label + glyph.
- Tables use proper `<table>`, `<th scope>`, captions (visually hidden ok).
- Dialogs trap focus, ESC closes, return focus to trigger.
- Respect `prefers-reduced-motion`: disable all transitions.
- Min hit target 40px height on touch.
- Live regions (`aria-live="polite"`) for banners and rate-limit countdown.

## 9. Motion
- Minimal. 120ms ease-out on color/border changes only. No page-transition animations, no entrance fade-ups, no staggered list reveals, no spring physics. Dialogs appear instantly or with 100ms opacity.

## 10. Copy & tone
- Plain, exact, slightly formal. Sentence case. No exclamation marks. No emoji.
- Money: `₹` or currency code per account, thousands separators per locale, always two decimals, mono.
- Dates: `13 Nov 2026` in prose; ISO-ish `2026-11-13 11:59` in tables (mono).
- Button verbs are specific: "Confirm transfer", "Approve application", "Suspend user" — not "Submit" / "Continue" where avoidable.

## 11. Implementation notes
- Centralise tokens in one file (`tokens.css` or Tailwind `theme.extend`). Components consume tokens only.
- Build shared primitives first: `Button, Input, Select, Textarea, Badge, Panel, Table, Dialog, Banner, Tabs, Stepper, DefinitionList, MoneyCell`.
- `MoneyCell` handles sign, color, mono, right-align in one place.
- Keep existing component/file names where possible to minimise diff; refactor styling only.
- Remove unused UI libraries' default themes (e.g. MUI/shadcn defaults) or override fully via tokens.
- Responsive breakpoints: 640, 900, 1200. Tables scroll horizontally inside their container on small screens with sticky first column; do not convert to card lists.

## 12. Definition of done
- [ ] No item from §2 present anywhere.
- [ ] All colors via tokens; no raw hex in components.
- [ ] All money/IDs/timestamps in mono tabular figures, right-aligned for numbers.
- [ ] Every screen in §7 restyled, with loading, empty, error states.
- [ ] Keyboard-only walkthrough of login → onboarding → transfer → admin audit works.
- [ ] Lighthouse accessibility ≥ 95.
- [ ] Screenshot review at 1440, 1024, 768, 390 widths: no horizontal page scroll, no floating bars.
- [ ] Existing functionality (auth, RBAC, rate limit messaging, onboarding flow, audit log access) unchanged.
