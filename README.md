# Electron

A grid-based programming puzzle game built with Next.js and TypeScript.

## About

Electron is an educational puzzle game where players program an "electron" to navigate through circuit-like grids. Players create sequences of instructions (forward, turn, pickup, putdown) to guide the electron, collect data, and deliver it to target locations. The game teaches programming concepts like loops and conditionals in a fun, visual way.

## How to Play

1. **Start the game** - Select a level from the start screen
2. **Build your program** - Use the action bar to add instructions:
   - **Forward** - Move one cell in the current direction
   - **Left/Right** - Turn 90 degrees
   - **Pickup** - Collect data from a data cell
   - **Putdown** - Place data on an empty target
   - **Loop** - Repeat your program from the beginning
   - **IF conditions** - Execute actions only when conditions are met
3. **Run your program** - Press Run to watch your electron execute the instructions
4. **Win condition** - Deliver all data to the target cells to complete the level

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start

# Run linter
npm run lint

# Run tests
npm test -- run
```

## Environment Setup

Copy `.env.example` to `.env.local` and configure your Supabase credentials for the leaderboard feature.

## Documentation

For more detailed information, see these documentation files:

| File                                   | Description                                   |
| -------------------------------------- | --------------------------------------------- |
| [SUPABASE_SETUP.md](SUPABASE_SETUP.md) | How to configure Supabase for the leaderboard |
| [test.md](test.md)                     | How to run tests and level element reference  |
| [GameFlow.md](GameFlow.md)             | Game flow and mechanics                       |
| [Files.md](Files.md)                   | Project file structure                        |
| [Report01.md](Report01.md)             | Development report #1                         |
| [Report02.md](Report02.md)             | Development report #2                         |

---

## Developer Notes

- This is a small Next.js (App Router) TypeScript app (see `app/layout.tsx` and `app/page.tsx`) that implements a grid-based puzzle game.
- UI is in `src/components` (main game pieces under `src/components/Game` and start screen under `src/components/StartScreen`).
- Game rules and pure logic live under `src/game` (`engine.ts`, `conditions.ts`, `types.ts`, `levels.ts`). Treat these as the source of truth for rules and state transitions.
- App-level state uses Zustand in `src/store/useGameStore.ts`. Keep UI components thin and move logic to `src/game` where possible.
- `src/lib/supabase.ts` creates a client that expects `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client-side keys) — the app reads a `leaderboard` table with `{ name, score }`.

## Important developer workflows

- Local dev: `npm run dev` (Next dev server on port 3000)
- Build: `npm run build` and `npm start`
- Lint: `npm run lint` (ESLint)
- Tests: `npm test -- run` (see [test.md](test.md) for details)
- Deploy: follow standard Next.js deployment (Vercel recommended).

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
