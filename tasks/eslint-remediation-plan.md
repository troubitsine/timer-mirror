# ESLint Remediation Plan
Where: /Users/ivantroubitsine/timer-mirror (root). What: Stepwise plan to resolve current ESLint errors/warnings while preserving behavior and frosted-glass UI. Why: Provide safe, reviewable phases an AI agent can execute and verify incrementally.

## Context
- Lint run: 31 errors, 98 warnings (`npm run lint`).
- Critical rules: conditional hooks (`App.tsx`, Storybook), setState inside effects (grid views, home, animated tabs), impure renders (`SessionMontage` randomness), hook purity/order (`useDynamicBackground`), TS comment misuse in media pipeline/Vite config.
- Lower-severity cleanup: missing effect deps, unused imports/vars, `any` types (stories, utils), fast-refresh hints, empty interfaces.

## Phase 1: Fix hook order and render purity (runtime)
- Make router hook usage unconditional (`App.tsx` `useRoutes` gating) to satisfy hooks order without changing routing behavior.
- Move `SessionMontage` randomness into stable per-mount values (e.g., seed via `useRef` + `useMemo`) so animations stay deterministic across renders.
- Adjust `useDynamicBackground` to avoid referencing `handleBackgroundSelect` before declaration; keep callback behavior intact.
- Verification: `npm run lint` (expect hook/purity errors reduced), manual smoke: load `/` and `/complete` routes still render.

## Phase 2: Replace effect-based state resets with safer initialization
- `home.tsx`, `SessionGridView`, `ShareSessionGridView`, `ui/animated-tabs`: move mount-time resets into `useState` initializers or guarded effects (skip redundant state writes) to clear `react-hooks/set-state-in-effect` without altering initial UI.
- Ensure layout effects only set layout state after measurements; avoid resetting `tiles` every render when dependencies unchanged.
- Verification: `npm run lint`; manual: timer card renders, montage/grid layouts still populate.

## Phase 3: Effect dependency and ref-safety cleanup
- Add missing deps or stable refs in `CameraFeed` effects (capture lifecycle) and `useDynamicBackground` (color extraction) while preventing double-initialization (prefer `useRef` flags).
- Stabilize `SessionMontage` animation callbacks (`startAnimation`) with `useCallback`/deps; capture `videoRef` in cleanup where flagged.
- Verification: `npm run lint`; manual: camera feed still starts/stops; montage replay works.

## Phase 4: Media pipeline TypeScript hygiene
- Swap `@ts-ignore` for `@ts-expect-error` with rationale in `lib/mediaCapture.ts`, `usePictureInPicture.ts`, `vite.config.ts`; remove async promise executor; type obvious `any` usages.
- Keep behavior identical by documenting intentional exceptions (browser APIs, third-party types).
- Verification: `npm run lint`; optional `npm run build` to ensure TS still passes.

## Phase 5: UI primitives and config lint fixes
- Resolve empty interface warnings (`ui/command.tsx`, `input.tsx`, `textarea.tsx`) by removing redundant interfaces or adding members.
- Handle fast-refresh warnings by relocating shared constants/helpers out of component files where minimal change; ensure exports remain stable.
- Verification: `npm run lint`; quick UI smoke (buttons, badges still render).

## Phase 6: Storybook and typing tidy-up (low risk)
- Fix hook misuse in stories (e.g., move `useState` into components, address unused expression in `menubar.stories.tsx`).
- Gradually replace `any` in stories with lightweight typings; drop unused imports/vars.
- Verification: `npm run lint`; optional `npm run storybook` if available (not required for core app).

## Phase 7: Final cleanup pass
- Remove remaining unused imports/vars across components (`CameraFeed`, `SessionCompletePage`, `ShareSessionButton`, etc.).
- Re-run `npm run lint` to confirm zero errors/warnings; commit-ready state once clean.

## Ongoing safeguards
- After phases that touch media/capture, manually check: onboarding flow, camera permission states, timer run/complete, montage/grid export visuals.
- Keep files ≤300 LOC; preserve frosted-glass tokens; prefer `useMemo`/derived state over effect resets to avoid regressions.
