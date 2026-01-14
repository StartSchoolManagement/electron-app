# GitHub Copilot instructions for Electron repo

Short, actionable guidance so an AI dev agent can be productive immediately.

## Big picture

- This is a small Next.js (App Router) TypeScript app (see `app/layout.tsx` and `app/page.tsx`) that implements a grid-based puzzle game.
- UI is in `src/components` (main game pieces under `src/components/Game` and start screen under `src/components/StartScreen`).
- Game rules and pure logic live under `src/game` (`engine.ts`, `conditions.ts`, `types.ts`, `levels.ts`). Treat these as the source of truth for rules and state transitions.
- App-level state uses Zustand in `src/store/useGameStore.ts`. Keep UI components thin and move logic to `src/game` where possible.
- `src/lib/supabase.ts` creates a client that expects `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client-side keys) — the app reads a `leaderboard` table with `{ name, score }`.

## Important developer workflows

- Local dev: `npm run dev` (Next dev server on port 3000)
- Build: `npm run build` and `npm start`
- Lint: `npm run lint` (ESLint)
- No tests present — add tests under `src/__tests__` if you introduce logic that requires coverage.
- Deploy: follow standard Next.js deployment (Vercel recommended in `README.md`).

## Patterns & conventions (project-specific)

- "use client": many components are client components (interactive Game UI). Server components are rare; default to client for interactive UI.
- Game state separation: keep pure logic in `src/game` (pure functions) and mutable/runtime state in `src/store/useGameStore.ts`.
  - Example: `checkCondition` in `src/game/conditions.ts` is intentionally pure and side-effect free; reuse it in tests.
- Program model: `ProgramNode` union is defined in `src/game/engine.ts` and used across UI and engine. When changing actions, update:
  - `src/game/engine.ts` (execution logic)
  - `src/game/types.ts` (if you add new type aliases used in other parts)
  - `src/components/Game/actionIcons.ts` and UI pickers (e.g. `ActionBar.tsx`) to reflect icons/UI for new actions.
- Player state naming mismatch: `src/game/engine.ts` uses `carrying: boolean`, while `src/game/types.ts` uses `carryingData: boolean`. Be careful when changing or extending player state fields — standardize names if you modify related code.

## Integration & external dependencies

- Supabase: `src/lib/supabase.ts` (requires env vars). The leaderboard expects `leaderboard` table rows with `name` and `score`.
- `gsap` is included for animations, `tailwindcss` for styling; keep component classes idiomatic Tailwind.
- State library: `zustand` (single-store pattern in `useGameStore.ts`). Use selectors and setter functions defined there.

## Example tasks & where to edit

- Add a new primitive action (e.g., `jump`):
  1. Add action to `PrimitiveAction` union in `src/game/engine.ts` and handle in `executePrimitive`.
  2. Add icon and picker button in `src/components/Game/actionIcons.ts` and `ActionBar.tsx`.
  3. Update `src/game/types.ts` if you expose the new action in types shared elsewhere.
- Change level layout or add levels: edit `src/game/levels.ts`, update tests or game expectations.

## What not to assume

- No test harness or CI configured by default. Don't assume lint rules enforce project style beyond `eslint` present.
- Supabase env vars are required for leaderboard runtime. Local dev without them will cause client runtime errors when `Leaderboard` mounts.

---

If anything here is incomplete or you want more agent-focused automation (e.g., PR templates, code mod hints, tests to assert game rules), say what to prioritize and I will iterate.
