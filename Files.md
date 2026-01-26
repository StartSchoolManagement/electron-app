# Project Files Documentation

Overview of all files in the Electron game project and their responsibilities.

---

## 📁 Root Configuration Files

| File                 | Purpose                                                         |
| -------------------- | --------------------------------------------------------------- |
| `package.json`       | NPM dependencies and scripts (`dev`, `build`, `start`, `lint`)  |
| `tsconfig.json`      | TypeScript configuration with strict mode, path aliases (`@/*`) |
| `next.config.js`     | Next.js configuration                                           |
| `postcss.config.mjs` | PostCSS config for Tailwind CSS v4                              |
| `eslint.config.mjs`  | ESLint rules for Next.js + TypeScript                           |
| `netlify.toml`       | Netlify deployment configuration                                |
| `.env.local`         | Environment variables (Supabase keys)                           |

---

## 📁 src/app/ — Next.js App Router

| File          | Purpose                                                                              |
| ------------- | ------------------------------------------------------------------------------------ |
| `layout.tsx`  | Root layout - imports globals.css, renders `<AppLifecycle />` component              |
| `page.tsx`    | Main page - conditionally renders `StartScreen` or `GameScreen` based on store state |
| `globals.css` | Global styles + Tailwind CSS import (`@import "tailwindcss"`)                        |

---

## 📁 src/game/ — Game Logic (Pure Functions)

| File            | Purpose                                                                                                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`      | **Single source of truth** for all TypeScript types: `Direction`, `PrimitiveAction`, `Condition`, `ProgramNode`, `PlayerState`, `Level`, `Teleport`, `Grid`                       |
| `engine.ts`     | Combined game engine containing: `runProgram()` (async UI runner with callbacks), `executeProgram()` (sync execution), helper functions. Uses `checkCondition` from conditions.ts |
| `conditions.ts` | **Single source** of `checkCondition()` function for evaluating game conditions (onData, onEmpty, carrying, onCorner variants). Imported by engine.ts                             |
| `levels.ts`     | Array of level definitions with layout grids, maxData, maxActions, allowedActionsCount                                                                                            |

---

## 📁 src/store/ — State Management

| File              | Purpose                                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `useGameStore.ts` | Zustand store containing all app state: screen navigation, level progress, program slots, player position, scoring, leaderboard submission. Exports `useGameStore` hook. |

---

## 📁 src/lib/ — External Services

| File          | Purpose                                                                                |
| ------------- | -------------------------------------------------------------------------------------- |
| `supabase.ts` | Supabase client initialization with env var validation. Used for leaderboard database. |

---

## 📁 src/components/ — React Components

### Root Components

| File               | Purpose                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| `AppLifecycle.tsx` | Handles app lifecycle events: submits pending scores on load, saves score to localStorage on `beforeunload` |

### src/components/StartScreen/

| File              | Purpose                                                                    |
| ----------------- | -------------------------------------------------------------------------- |
| `StartScreen.tsx` | Start screen UI: name input, start button, StartSchool link, leaderboard   |
| `Leaderboard.tsx` | Fetches and displays top 10 scores from Supabase, auto-refreshes every 60s |

### src/components/Game/

| File               | Purpose                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| `GameScreen.tsx`   | Main game container - renders Grid, ActionBar, Controls, VictoryModal                                |
| `Grid.tsx`         | Renders the game grid as CSS grid of Cell components                                                 |
| `Cell.tsx`         | Single grid cell - renders appropriate tile SVG based on cell type, shows Electron if player is here |
| `Electron.tsx`     | Player character with GSAP pulsing glow animation, rotates based on direction                        |
| `ActionBar.tsx`    | Program slot UI (shows current program), action pickers (action, condition, then-action)             |
| `PickerButton.tsx` | Reusable button component for action/condition picker modals                                         |
| `actionIcons.tsx`  | Maps `ProgramNode` type to corresponding SVG icon component                                          |
| `Controls.tsx`     | Run/Reset/Quit buttons, speed selector (1x/2x/4x), StartSchool link                                  |
| `VictoryModal.tsx` | Modal shown on level completion with points and Continue/Quit buttons                                |

### src/components/Game/svg/ — SVG Icon Components

| File                  | Renders                                |
| --------------------- | -------------------------------------- |
| `Forward.tsx`         | Forward arrow (↑)                      |
| `ArrowLeft.tsx`       | Turn left arrow                        |
| `ArrowRight.tsx`      | Turn right arrow                       |
| `ArrowLoop.tsx`       | Loop/repeat icon                       |
| `PickUp.tsx`          | Pick up data action icon               |
| `PutDown.tsx`         | Put down data action icon              |
| `WordIF.tsx`          | "IF" conditional text                  |
| `DataFull.tsx`        | Data source cell (filled)              |
| `DataEmpty.tsx`       | Empty target cell                      |
| `LaneVertical.tsx`    | Vertical lane tile (│) with green glow |
| `LaneHorizontal.tsx`  | Horizontal lane tile (─)               |
| `LaneCross.tsx`       | Intersection tile (+)                  |
| `LaneCornerUp.tsx`    | Corner turning up                      |
| `LaneCornerDown.tsx`  | Corner turning down                    |
| `LaneCornerLeft.tsx`  | Corner turning left                    |
| `LaneCornerRight.tsx` | Corner turning right                   |

---

## 📁 public/ — Static Assets

Static files served at root URL (favicon, images if any).

---

## 📁 Documentation Files

| File          | Purpose                                                       |
| ------------- | ------------------------------------------------------------- |
| `README.md`   | Project overview and setup instructions                       |
| `Report01.md` | Initial code review report (historical)                       |
| `Report02.md` | Updated code review report with completed fixes and TODO list |
| `GameFlow.md` | Game flow documentation with sequence diagrams                |
| `Files.md`    | This file - describes all project files                       |

---

## File Dependency Graph

```
page.tsx
├── useGameStore.ts ← Zustand store
├── StartScreen.tsx
│   ├── useGameStore.ts
│   └── Leaderboard.tsx
│       └── supabase.ts
└── GameScreen.tsx
    ├── useGameStore.ts
    ├── levels.ts
    ├── Grid.tsx
    │   └── Cell.tsx
    │       ├── Electron.tsx
    │       └── svg/*.tsx
    ├── ActionBar.tsx
    │   ├── types.ts
    │   └── actionIcons.tsx
    ├── Controls.tsx
    │   └── engine.ts
    │       └── types.ts
    └── VictoryModal.tsx

engine.ts
├── types.ts (imports all type definitions)
├── conditions.ts (imports checkCondition)
└── (execution logic uses shared condition checking)

conditions.ts
└── types.ts (imports Condition, PlayerState, Grid)
```

---

## Type Definitions (src/game/types.ts)

```typescript
// Cell representation
type CellType = string; // '0'-'9', 'A'-'Z', 'e', '+', 'T'

// Movement
type Direction = "up" | "right" | "down" | "left";

// Actions
type PrimitiveAction = "forward" | "left" | "right" | "pickup" | "putdown";

// Conditions for IF statements
type Condition =
  | "onData"
  | "onEmpty"
  | "carrying"
  | "onCorner"
  | "onCornerUp"
  | "onCornerDown"
  | "onCornerLeft"
  | "onCornerRight";

// Program instructions
type ProgramNode =
  | { type: "action"; action: PrimitiveAction }
  | { type: "loop" }
  | { type: "if"; condition: Condition | Condition[]; then: ProgramNode };

// Player state
interface PlayerState {
  x: number;
  y: number;
  direction: Direction;
  carrying: boolean;
}

// Level definition
interface Level {
  name: string;
  allowedActionsCount: number;
  maxActions: number;
  maxData?: number;
  layout: string[];
  teleports?: Teleport[];
}

// Grid alias
type Grid = string[][];
```

---

**End of Files Documentation**
