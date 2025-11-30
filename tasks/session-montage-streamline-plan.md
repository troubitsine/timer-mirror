# Session montage interaction refactor plan
Brief: merge ShareSessionMontage’s shuffle stack into SessionMontage while unifying dynamic background + card/grid behaviors. Each step below is independently shippable and verifiable from the terminal (incl. Playwright MCP).

## Step 0 — Baseline capture
- Action: Record current behaviors and props in `SessionMontage.tsx`, `ShareSessionMontage.tsx`, `SessionGridView.tsx` (photo interleave logic, animation phases, background selection, controls).
- Verify: `npm run lint && npm run build`. For UI reference, start dev server (`npm run dev -- --host --port 4173`) and use Playwright MCP to load `http://localhost:4173/` and screenshot montage/share screens (use `browser_snapshot` + `browser_take_screenshot`). Note any visual state to compare later.

## Step 1 — Extract shared media selection
- Action: Add a shared hook/util (e.g., `useSessionMedia`) returning memoized `allPhotos`, `lastPhoto`, `numberOfCards`, `hasScreenshots`, preserving current interleave/mobile rules.
- Verify: `npm run lint`. Add a small temporary script or story usage in each component to confirm outputs; use `node -e` to log hook outputs with sample arrays. No UI change yet.

## Step 2 — Create a shared frame for dynamic background + badge/controls
- Action: Introduce a wrapper (e.g., `SessionFrame`) that owns `useDynamicBackground`, renders backdrop overlay, watermark, badge slot, background selector, and forwards `exportRef`/`hideControls`/className. Refactor the three components to use it.
- Verify: `npm run lint && npm run build`. Launch dev server; with Playwright MCP, load montage/grid/share views and toggle background selector to confirm selection updates the frame styling. Capture snapshots before/after toggle.

## Step 3 — Extract shuffleable card stack
- Action: Move ShareSessionMontage’s lift/peel/back shuffle logic into a reusable `<CardStack>` (or hook) accepting `photos`, `aspectRatio`, sizing props, and shuffle handler. Keep per-card photo assignment and random rotations.
- Verify: Add temporary playground inside ShareSessionMontage to ensure behavior unchanged. `npm run lint`. Use Playwright MCP: open share montage view, click the stack multiple times, confirm cards cycle (by capturing sequential screenshots or checking top image src via `browser_evaluate`).

## Step 4 — Integrate stack into SessionMontage after spiral intro
- Action: Keep the initial spiral fan-out; once it collapses, swap to the shared `<CardStack>` for the pile/shuffle state. Ensure replay re-triggers spiral and rehydrates stack order; transitions stay smooth.
- Verify: `npm run lint && npm run build`. Run dev server; with Playwright MCP, record a short interaction: wait for spiral to collapse, click to shuffle, confirm top card changes (screenshot or `browser_evaluate` to read image `src`). Check both desktop and mobile viewport sizes via `browser_resize`.

## Step 5 — Unify card vs grid view toggling
- Action: Provide a single prop or wrapper that renders either `<CardStack>` or grid inside the shared frame without duplicating controls/background logic. Ensure aspect ratio options still apply where needed.
- Verify: `npm run lint`. With Playwright MCP, navigate to each view and confirm backgrounds, badges, selectors, and view content update correctly when switching modes (simulate props or route toggles if available). Capture comparison screenshots for card vs grid.

## Step 6 — Cleanup and regression pass
- Action: Remove obsolete code paths, ensure files stay ≤300 LOC with brief headers. Re-read all touched files to confirm consistency.
- Verify: `npm run lint && npm run build`. Final Playwright MCP pass: load key screens, test background selector, spiral→stack shuffle, grid display, `hideControls` (if exposable), and confirm watermark/badge placement. Archive final snapshots for before/after comparison.
