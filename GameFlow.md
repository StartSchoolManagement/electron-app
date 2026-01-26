# Game Flow Documentation

This document describes the flow of the Electron game and which files are involved at each stage.

---

## 🏗️ Application Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        App Entry                                 │
│  layout.tsx → page.tsx → (StartScreen | GameScreen)             │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────────┐
│     START SCREEN        │     │         GAME SCREEN             │
│  StartScreen.tsx        │     │  GameScreen.tsx                 │
│  Leaderboard.tsx        │     │  Grid.tsx → Cell.tsx → Electron │
│                         │     │  ActionBar.tsx                  │
│                         │     │  Controls.tsx                   │
│                         │     │  VictoryModal.tsx               │
└─────────────────────────┘     └─────────────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SHARED LAYER                                 │
│  useGameStore.ts (Zustand) ← State Management                   │
│  supabase.ts ← Leaderboard Database                             │
│  levels.ts ← Level Data                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 File Usage by Screen

### 1. App Bootstrap (Always Loaded)

| File                                                               | Purpose                                                    |
| ------------------------------------------------------------------ | ---------------------------------------------------------- |
| [src/app/layout.tsx](src/app/layout.tsx)                           | Root layout, loads global CSS, renders `<AppLifecycle />`  |
| [src/app/globals.css](src/app/globals.css)                         | Tailwind CSS and global styles                             |
| [src/app/page.tsx](src/app/page.tsx)                               | Main page, conditionally renders StartScreen or GameScreen |
| [src/components/AppLifecycle.tsx](src/components/AppLifecycle.tsx) | Handles pending score submission on page load/unload       |
| [src/store/useGameStore.ts](src/store/useGameStore.ts)             | Zustand store - all app state lives here                   |

---

### 2. Start Screen

**Displayed when:** `screen === 'start'` in useGameStore

| File                                                                                     | Purpose                                          |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------ |
| [src/components/StartScreen/StartScreen.tsx](src/components/StartScreen/StartScreen.tsx) | Main start screen UI - name input, start button  |
| [src/components/StartScreen/Leaderboard.tsx](src/components/StartScreen/Leaderboard.tsx) | Fetches and displays top 10 scores from Supabase |
| [src/lib/supabase.ts](src/lib/supabase.ts)                                               | Supabase client for leaderboard queries          |

**User Flow:**

```
User enters name → Clicks "Start"
    ↓
localStorage.setItem('playerName', name)
    ↓
resetPlayer() → setScreen('game')
    ↓
Navigates to Game Screen
```

---

### 3. Game Screen

**Displayed when:** `screen === 'game'` in useGameStore

#### UI Components

| File                                                                         | Purpose                                                                 |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [src/components/Game/GameScreen.tsx](src/components/Game/GameScreen.tsx)     | Main game container - renders Grid, ActionBar, Controls, VictoryModal   |
| [src/components/Game/Grid.tsx](src/components/Game/Grid.tsx)                 | Renders the game grid using Cell components                             |
| [src/components/Game/Cell.tsx](src/components/Game/Cell.tsx)                 | Single grid cell - renders lane tiles, data, empty targets, teleporters |
| [src/components/Game/Electron.tsx](src/components/Game/Electron.tsx)         | The player character with GSAP glow animation                           |
| [src/components/Game/ActionBar.tsx](src/components/Game/ActionBar.tsx)       | Program slot UI + action/condition pickers                              |
| [src/components/Game/PickerButton.tsx](src/components/Game/PickerButton.tsx) | Reusable button component for picker modals                             |
| [src/components/Game/actionIcons.tsx](src/components/Game/actionIcons.tsx)   | Maps ProgramNode to SVG icon                                            |
| [src/components/Game/Controls.tsx](src/components/Game/Controls.tsx)         | Run/Reset/Quit buttons + speed selector                                 |
| [src/components/Game/VictoryModal.tsx](src/components/Game/VictoryModal.tsx) | Shown on level completion                                               |

#### SVG Assets (in `src/components/Game/svg/`)

| File                | Represents                 |
| ------------------- | -------------------------- |
| Forward.tsx         | Forward action icon (↑)    |
| ArrowLeft.tsx       | Turn left action           |
| ArrowRight.tsx      | Turn right action          |
| ArrowLoop.tsx       | Loop instruction           |
| PickUp.tsx          | Pick up data action        |
| PutDown.tsx         | Put down data action       |
| WordIF.tsx          | Conditional IF instruction |
| DataFull.tsx        | Cell with data (source)    |
| DataEmpty.tsx       | Empty target cell          |
| LaneVertical.tsx    | Vertical lane tile (│)     |
| LaneHorizontal.tsx  | Horizontal lane tile (─)   |
| LaneCornerUp.tsx    | Corner turning up          |
| LaneCornerDown.tsx  | Corner turning down        |
| LaneCornerLeft.tsx  | Corner turning left        |
| LaneCornerRight.tsx | Corner turning right       |
| LaneCross.tsx       | Intersection (+)           |

---

### 4. Game Logic Layer

| File                                             | Purpose                                                                                            |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| [src/game/types.ts](src/game/types.ts)           | **Single source of truth** for all types (Level, PlayerState, ProgramNode, Direction, Condition)   |
| [src/game/levels.ts](src/game/levels.ts)         | Array of level definitions (layout, maxData, maxActions, etc.)                                     |
| [src/game/engine.ts](src/game/engine.ts)         | Combined engine: `runProgram()` (async UI runner), `executeProgram()` (sync), all helper functions |
| [src/game/conditions.ts](src/game/conditions.ts) | **Single source** of `checkCondition()` - imported and used by engine.ts                           |

---

## 🎮 Game Flow Sequences

### Sequence 1: Starting a Game

```
┌──────────────────┐
│   StartScreen    │
│                  │
│  [Name Input]    │
│  [Start Button]  │
└────────┬─────────┘
         │ onClick: start()
         ▼
┌──────────────────────────────────────┐
│ localStorage.setItem('playerName')   │
│ resetPlayer()  ← useGameStore        │
│   → findStart(levelIndex)            │
│   → buildGrid(levelIndex)            │
│ setScreen('game')                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────┐
│   GameScreen     │
│                  │
│  Grid + Electron │
│  ActionBar       │
│  Controls        │
└──────────────────┘
```

### Sequence 2: Building a Program

```
User clicks empty slot in ActionBar
         │
         ▼
┌─────────────────────────────┐
│ openPicker(index)           │
│ setPicker('action')         │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Action Picker appears       │
│ [↑] [←] [→] [⬆] [⬇] [↺] [IF]│
└────────┬────────────────────┘
         │ User clicks action
         ▼
┌─────────────────────────────┐
│ commitNode(node)            │
│   → addNode() or setNodeAt()│
│   → program[] updated       │
└─────────────────────────────┘
```

### Sequence 3: Running the Program

```
User clicks [RUN] button
         │
         ▼
┌──────────────────────────────────────────────┐
│ Controls.tsx: onClick                        │
│   setRunning(true)                           │
│   startScoring() ← timer starts (-1pt/sec)   │
└────────┬─────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ runProgram() ← src/game/engine.ts            │
│                                              │
│   For each instruction:                      │
│     1. onInstruction(idx) → highlight slot   │
│     2. execute(level, state, node, grid)     │
│     3. onStep(newState) → animate Electron   │
│     4. onGridChange(grid) → update cells     │
│     5. delay(500ms / speed)                  │
│                                              │
│   Loop back if hasLoop && pc >= length       │
└────────┬─────────────────────────────────────┘
         │
    ┌────┴────┬─────────────┐
    ▼         ▼             ▼
┌────────┐ ┌────────┐ ┌──────────────┐
│ 'dead' │ │ 'won'  │ │ finished     │
│        │ │        │ │ (no win/die) │
└───┬────┘ └───┬────┘ └──────┬───────┘
    │          │             │
    ▼          ▼             ▼
┌────────┐ ┌────────────┐ ┌─────────────┐
│onDead()│ │ onWin()    │ │ setRunning  │
│setDead │ │ setWon()   │ │ (false)     │
│ "short │ │ finalize   │ │             │
│circuit"│ │ Score      │ │             │
└────────┘ └─────┬──────┘ └─────────────┘
                 │
                 ▼
         ┌──────────────┐
         │ VictoryModal │
         │ [Continue]   │
         │ [Quit]       │
         └──────────────┘
```

### Sequence 4: Victory → Next Level

```
VictoryModal: [Continue] clicked
         │
         ▼
┌──────────────────────────────────┐
│ clearWin()                       │
│ nextLevel()                      │
│   → levelIndex++                 │
│   → findStart(next)              │
│   → buildGrid(next)              │
│   → program = []                 │
│   → currentPoints = 300          │
└──────────────────────────────────┘
```

### Sequence 5: Quit to Start Screen

```
User clicks [QUIT]
         │
         ▼
┌──────────────────────────────────┐
│ quitLevel()                      │
│   → finalizeLevelScore(1)        │
│   → submitScore() (if level > 1) │
│   → setScreen('start')           │
│   → resetProgram()               │
│   → resetPlayer()                │
└──────────────────────────────────┘
         │
         ▼
┌──────────────────┐
│   StartScreen    │
│   Leaderboard    │
│   refreshes      │
└──────────────────┘
```

---

## 📊 State Management (useGameStore.ts)

### Key State Properties

| Property         | Type                | Purpose                                       |
| ---------------- | ------------------- | --------------------------------------------- |
| `screen`         | `'start' \| 'game'` | Current screen                                |
| `levelIndex`     | `number`            | Current level (0-indexed)                     |
| `program`        | `ProgramNode[]`     | User's program instructions                   |
| `grid`           | `string[][]`        | Mutable copy of level layout                  |
| `player`         | `PlayerState`       | Player position, direction, carrying          |
| `running`        | `boolean`           | Is program executing?                         |
| `dead`           | `boolean`           | Did player die?                               |
| `won`            | `boolean`           | Did player win level?                         |
| `executingIndex` | `number \| null`    | Currently executing instruction slot          |
| `currentPoints`  | `number`            | Points for current level (starts 300, -1/sec) |
| `totalScore`     | `number`            | Accumulated score across levels               |
| `levelScores`    | `number[]`          | Score per completed level                     |

### Key Actions

| Action                  | Purpose                           |
| ----------------------- | --------------------------------- |
| `setScreen(s)`          | Switch between start/game         |
| `addNode(node)`         | Append instruction to program     |
| `setNodeAt(i, node)`    | Replace instruction at index      |
| `insertNodeAt(i, node)` | Insert instruction at index       |
| `resetProgram()`        | Clear program and flags           |
| `resetPlayer()`         | Reset player to start position    |
| `setPlayer(p)`          | Update player state (during run)  |
| `setGrid(g)`            | Update grid (during run)          |
| `setRunning(v)`         | Start/stop execution              |
| `setDead()`             | Mark player as dead               |
| `setWon()`              | Mark level as won, finalize score |
| `nextLevel()`           | Advance to next level             |
| `quitLevel()`           | Return to start screen            |
| `startScoring()`        | Start point countdown timer       |
| `stopScoring()`         | Stop point countdown              |
| `submitScore()`         | Send score to Supabase            |

---

## 🗂️ Level Data Structure

From [src/game/levels.ts](src/game/levels.ts):

```typescript
interface Level {
  name: string; // "Level 1"
  allowedActionsCount: number; // How many action types unlocked
  maxActions: number; // Max program slots
  maxData: number; // Data items to deliver to win
  layout: string[]; // Grid rows as strings
}
```

### Tile Legend

| Code  | Meaning                        |
| ----- | ------------------------------ |
| `0`   | Void (death)                   |
| `1`   | Vertical lane                  |
| `6`   | Horizontal lane                |
| `+`   | Intersection                   |
| `2`   | Corner (turn right)            |
| `3`   | Corner (turn up)               |
| `4`   | Corner (turn left)             |
| `5`   | Corner (turn down)             |
| `7`   | Start position                 |
| `8`   | Data source (pickup)           |
| `9`   | Empty target (putdown)         |
| `A-Z` | Teleporters (A→B, C→D, etc.)   |
| `e`   | Extracted-empty (after pickup) |

---

## 🔗 File Dependency Graph

```
page.tsx
├── useGameStore.ts
├── StartScreen.tsx
│   ├── useGameStore.ts
│   └── Leaderboard.tsx
│       ├── supabase.ts
│       └── useGameStore.ts
└── GameScreen.tsx
    ├── useGameStore.ts
    ├── levels.ts
    ├── Grid.tsx
    │   ├── useGameStore.ts
    │   └── Cell.tsx
    │       ├── Electron.tsx (gsap, types.ts)
    │       └── svg/*.tsx
    ├── ActionBar.tsx
    │   ├── useGameStore.ts
    │   ├── levels.ts
    │   ├── types.ts (ProgramNode, Condition)
    │   ├── PickerButton.tsx
    │   ├── actionIcons.tsx
    │   └── svg/*.tsx
    ├── Controls.tsx
    │   ├── useGameStore.ts
    │   ├── engine.ts (runProgram)
    │   │   ├── types.ts
    │   │   └── conditions.ts (checkCondition)
    │   └── levels.ts
    └── VictoryModal.tsx
        └── useGameStore.ts
```

---

**End of Game Flow Documentation**
