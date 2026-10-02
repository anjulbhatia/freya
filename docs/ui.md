# UI contract

## Tokens (`apps/webui/app/globals.css`)

- Layered surfaces: `app-shell` frames the app, `page-canvas` holds boards
  and lists, `surface` groups bounded content (columns, panels),
  `surface-raised` floats above (overlays, quick-add inputs).
  Never wash groups in `bg-muted/40`.
- Shadows by elevation: `surface-shadow` (cards, columns),
  `floating-shadow` (dialogs, drag state), `menu-shadow` (menus, popovers).
- Type scale (role-named, only sizes allowed): `text-micro` (badges,
  timestamps) / `text-caption` (helper text, summaries) / `text-label`
  (card titles, dense headers) / `text-body` (UI prose, dialogs) /
  `text-body-lg` (onboarding prose) / `text-title-sm` and up (headers).
  No arbitrary `text-[11px]` one-offs.
- Brand: `bg-brand` marks the dominant active state. `brandSubtle` marks
  activity without strong selection. `success / warning / info` are status
  only — `warning` rings cards awaiting approval.
- Motion: dialogs consume `--dialog-enter/exit-duration` and easing.
  Scrollbars use `scrollbar-thumb / track` tokens via `.fc-scroll`.

## Button (`components/ui/button.tsx`)

`default` (main action) / `brand` (active control) / `brandSubtle` (soft
activity) / `outline` (secondary) / `secondary` (neutral fill) / `ghost`
(toolbar) / `destructive` / `link`. One dominant action per dialog or form.
No `loading` prop — compose spinner + `disabled` + `aria-busy`. Icon-only
buttons need `aria-label`. Geometry lives in `--button-height-*` tokens,
not local overrides.

## Dialog (`components/ui/dialog.tsx`)

Compose `Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle,
DialogDescription, DialogFooter, DialogClose`. Title + concise description
required. Footer stays reachable. Close only after an async save succeeds —
preserve input and show the error on failure.

## Layout (`components/ui/page-header.tsx`)

`PageHeader` = title + one quiet meta line (counts, status) + optional
actions. No description paragraphs. `CollectionPage` = board shell on the
page canvas.

## Cards

Type edge bar + type pill per card type. Cards whose summary starts with
`Proposed` get a warning ring and an `awaiting approval` badge — the
approval gate must be visible at a glance. Advance control reveals on hover
(and always on keyboard focus). Summaries clamp to 3 lines.

## Copy

Descriptions omitted by default. Never restate titles, statuses, or button
actions. Help text only for a non-obvious consequence or next step, once,
beside the relevant control. Empty states stay one quiet line plus an
optional hint.
