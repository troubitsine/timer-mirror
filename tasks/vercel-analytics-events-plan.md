<!--
Where: tasks/vercel-analytics-events-plan.md
What: Plan to add Vercel Web Analytics custom event tracking to all interactive UI and task-name input.
Why: Provide consistent, privacy-conscious analytics coverage with minimal, reviewable changes.
-->
# Vercel Analytics Event Tracking Plan

## 0) Confirm current state (already done)
- `@vercel/analytics` is installed in `package.json`.
- `<Analytics />` is already rendered in `src/main.tsx`.
- `track()` is used in `src/components/SessionCompletePage.tsx`.

## 1) Docs + constraints (re-check before coding)
- Use context7 and Vercel docs to confirm custom event limits and supported value types.
- Note: Web Analytics custom events have name/key/value length limits and only accept flat primitive values (string/number/boolean/null; no nested objects).
- Note: Analytics events do not appear in local dev, so verification requires a preview/prod deploy.

## 2) Define analytics conventions + helper
- Create `src/lib/analytics.ts` with a small wrapper around `track()`:
  - `trackEvent(name, data)` that:
    - Enforces event name/key/value length ≤ 255 characters.
    - Truncates string values to ≤ 255 characters (task name included).
    - Filters out `undefined` and non-primitive values.
    - Optionally adds shared context fields (`route`, `isMobile`, `surface`).
- Export constants for event names to keep them short + consistent.
- Decide on a minimal event taxonomy, e.g. `click_*`, `input_*`, `toggle_*`, `share_*`.

## 3) Instrument interactive UI (map of targets)
**Task name input**
- `src/components/TaskNameInput.tsx` / `src/components/CameraFeed.tsx`
- Track final task name on `blur` and on session start (avoid per-keystroke spam).
- Include `taskName`, `length`, `source` (blur/start).

**Timer + camera flow**
- `src/components/CameraFeed.tsx`
  - Duration preset button clicks: `{ minutes, isMobile }`.
  - Range slider changes: `{ seconds, isMobile }` (throttle to avoid spam).
  - Start button click: `{ durationMinutes, hasPermission, isMobile, taskName }`.
  - Camera permission flow: request / granted / denied / error.
  - PiP button click: `{ width, height }`.
  - PiP variant toggle (Compact/Default): `{ from, to }`.
  - Secret buttons (end session / set 1-minute) if you want *all* interactions.

**Onboarding**
- `src/components/OnboardingDialog.tsx`
  - Dialog open/close.
  - Step dot click, next, skip, get started.
- `src/components/OnboardingCard.tsx`
  - About/Hide toggle.

**Session complete + views**
- `src/components/SessionCompletePage.tsx`
  - View switch: animation vs grid.
  - “Start New Timer” click.

**Share / download**
- `src/components/ShareSessionButton.tsx`
  - Share button click (open dialog vs mobile share).
  - Download click: include `{ aspectRatio, viewMode, backgroundId, format }`.
  - Share attempt/success/cancel/failure, fallback open.
  - Aspect ratio change + view mode change.
- `src/components/BackgroundColorSelector.tsx`
  - Background selection: include `{ selectedId, surface }`.

**Replay**
- `src/components/SessionMontage.tsx` and `src/components/ShareSessionMontage.tsx`
  - Replay button click.

**Any remaining interactions**
- Scan for `onClick`, `onChange`, `onValueChange`, and raw `<button>`/`<a>` tags to ensure coverage.

## 4) Task name data + anonymization
- Send full task name (trimmed + truncated to 255 chars).
- Avoid any user identifiers (no user ID, email, device ID) to keep analytics anonymous.
- Consider adding `taskNameLength` to enable segmentation without further PII exposure.

## 5) Verify + document
- Manual smoke pass in dev for runtime errors.
- Deploy to Vercel preview or production and confirm events appear.
- Add a short internal note in `README.md` or `tasks/` describing event names + where to add new ones.
