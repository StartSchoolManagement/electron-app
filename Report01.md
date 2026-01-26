# Report01 - Electron Project Code Review

**Date:** January 26, 2026  
**Reviewer:** Senior Next.js + TypeScript + Supabase Engineer

---

## 🔴 CRITICAL ISSUES

### 1. TypeScript Violations - `any` Usage

| File                                         | Line | Issue                                            | Severity    |
| -------------------------------------------- | ---- | ------------------------------------------------ | ----------- |
| [runProgram.ts](src/game/runProgram.ts#L51)  | 51   | `(level as any).maxData` - unsafe type cast      | 🔴 Critical |
| [runProgram.ts](src/game/runProgram.ts#L58)  | 58   | `(level as any).name` - unsafe type cast         | 🔴 Critical |
| [runProgram.ts](src/game/runProgram.ts#L174) | 174  | `condition: any` parameter type                  | 🔴 Critical |
| [runProgram.ts](src/game/runProgram.ts#L201) | 201  | `node.condition as any` - unsafe cast            | 🔴 Critical |
| [runProgram.ts](src/game/runProgram.ts#L255) | 255  | `(level as any).maxData` - unsafe type cast (x2) | 🔴 Critical |
| [engine.ts](src/game/engine.ts#L51)          | 51   | `(level as any).maxData` - unsafe type cast (x2) | 🔴 Critical |

**Root Cause:**  
The `Level` interface in [engine.ts](src/game/engine.ts) is incomplete compared to [types.ts](src/game/types.ts). The engine version lacks `name`, `maxData`, `allowedActionsCount`, and `maxActions` properties.

**Fix Required:**  
Update `Level` interface in [engine.ts](src/game/engine.ts) to match [types.ts](src/game/types.ts) or import from a single source.

---

### 2. Type Duplication & Inconsistency (CRITICAL STRUCTURAL ISSUE)

The project has **severe type fragmentation** across multiple files:

| Type              | Defined In                                     | Duplicated In                                                                          |
| ----------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| `Direction`       | [engine.ts](src/game/engine.ts#L5)             | [types.ts](src/game/types.ts#L3)                                                       |
| `PlayerState`     | [engine.ts](src/game/engine.ts#L18-L23)        | [types.ts](src/game/types.ts#L17-L22), [conditions.ts](src/game/conditions.ts#L13-L17) |
| `Level`           | [engine.ts](src/game/engine.ts#L29-L32)        | [types.ts](src/game/types.ts#L7-L15), [conditions.ts](src/game/conditions.ts#L19-L21)  |
| `PrimitiveAction` | [engine.ts](src/game/engine.ts#L7-L12)         | [actions.ts](src/game/actions.ts#L1-L6)                                                |
| `Condition`       | [conditions.ts](src/game/conditions.ts#L3-L11) | [actions.ts](src/game/actions.ts#L8-L11)                                               |
| `ProgramNode`     | [engine.ts](src/game/engine.ts#L14-L17)        | [program.ts](src/game/program.ts#L3-L14)                                               |

#### PlayerState Field Mismatch (DATA CORRUPTION RISK)

```typescript
// engine.ts & conditions.ts
carrying: boolean;

// types.ts
carryingData: boolean; // ⚠️ DIFFERENT NAME!
```

This mismatch can cause silent bugs if developers use the wrong type definition.

---

### 3. Duplicate Level Data Files

**100% Identical Content:**

- [levels.ts](src/game/levels.ts) (181 lines)
- [placeholder.ts](src/game/placeholder.ts) (181 lines)

Both files contain the exact same level definitions. **Delete `placeholder.ts`** - it serves no purpose.

---

## 🟠 HIGH PRIORITY ISSUES

### 4. Type-Unsafe Error Handling

| File                                                    | Line | Code        | Issue                    |
| ------------------------------------------------------- | ---- | ----------- | ------------------------ |
| [useGameStore.ts](src/store/useGameStore.ts#L171)       | 171  | `catch (e)` | Unused error variable    |
| [useGameStore.ts](src/store/useGameStore.ts#L177)       | 177  | `catch (_)` | Silently swallowed error |
| [useGameStore.ts](src/store/useGameStore.ts#L196)       | 196  | `catch (_)` | Silently swallowed error |
| [AppLifecycle.tsx](src/components/AppLifecycle.tsx#L33) | 33   | `catch (_)` | Silently swallowed error |
| [engine.ts](src/game/engine.ts#L46)                     | 46   | `catch (e)` | Empty error handler      |
| [runProgram.ts](src/game/runProgram.ts#L40)             | 40   | `catch (e)` | Empty error handler      |

**Fix:** Replace with explicit error handling or use `catch { /* intentionally ignored */ }` pattern.

---

### 5. Non-Null Assertion Without Validation

| File                                     | Line | Code                                    |
| ---------------------------------------- | ---- | --------------------------------------- |
| [supabase.ts](src/lib/supabase.ts#L3-L4) | 3-4  | `process.env.NEXT_PUBLIC_SUPABASE_URL!` |

If env vars are missing, the app crashes at runtime with an unhelpful error.

**Fix:**

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}
```

---

## 🟡 MEDIUM PRIORITY - OVERENGINEERING

### 6. Condition Checking Logic Duplicated 3 Times

The same switch-case logic for checking conditions appears in:

1. [conditions.ts](src/game/conditions.ts#L27-L56) - `checkCondition()`
2. [engine.ts](src/game/engine.ts#L104-L131) - `checkGridCondition()`
3. [runProgram.ts](src/game/runProgram.ts#L174-L196) - `gridCondition()`

All three do essentially the same thing. **Consolidate to one function.**

---

### 7. Grid Traversal Duplicated

Win-condition counting logic appears twice:

- [engine.ts](src/game/engine.ts#L213-L220) - counts placed data
- [runProgram.ts](src/game/runProgram.ts#L256-L262) - identical logic

**Consolidate into a utility function.**

---

### 8. `countInitialData()` Function Duplicated

- [engine.ts](src/game/engine.ts#L138-L142)
- [runProgram.ts](src/game/runProgram.ts#L157-L161)

Identical implementations. **Move to shared utilities.**

---

## 🔵 LOW PRIORITY - CODE QUALITY

### 9. Files That Should Be Split

| File                                               | Lines | Issue                                | Recommendation                                                                             |
| -------------------------------------------------- | ----- | ------------------------------------ | ------------------------------------------------------------------------------------------ |
| [ActionBar.tsx](src/components/Game/ActionBar.tsx) | 383   | Too large, multiple responsibilities | Split into: `ActionBar.tsx`, `ActionPicker.tsx`, `ConditionPicker.tsx`, `PickerButton.tsx` |
| [runProgram.ts](src/game/runProgram.ts)            | 290   | Contains inline execution engine     | Extract `execute()`, `move()`, `turnLeft()`, `turnRight()` to separate file                |
| [useGameStore.ts](src/store/useGameStore.ts)       | 275   | Monolithic store                     | Consider splitting into slices: `gameSlice`, `scoringSlice`, `leaderboardSlice`            |

---

### 10. Unused Imports / Dead Code

| File                              | Issue                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [actions.ts](src/game/actions.ts) | `Condition` type only has 3 values; [conditions.ts](src/game/conditions.ts) has full 8 values - inconsistent |
| [program.ts](src/game/program.ts) | Imports from `actions.ts`, but `engine.ts` defines its own types - this file may be unused                   |
| [types.ts](src/game/types.ts)     | `Action` type defined but never used (engine uses `PrimitiveAction`)                                         |

---

### 11. Empty Levels in Data

[levels.ts](src/game/levels.ts#L143-L179) contains 4 empty levels (11-14) with empty `layout: []` arrays. These will cause runtime errors if accessed.

---

## 📋 TODO LIST (Priority Order)

### 🔴 Critical (Must Fix)

- [ ] **1. Consolidate all type definitions into [types.ts](src/game/types.ts)**
  - Merge `PlayerState`, `Direction`, `Level`, `PrimitiveAction`, `ProgramNode`, `Condition`
  - Remove duplicates from `engine.ts`, `conditions.ts`, `actions.ts`, `program.ts`
  - Standardize `carrying` vs `carryingData` field name

- [ ] **2. Remove all `as any` casts**
  - Fix [runProgram.ts](src/game/runProgram.ts) lines 51, 58, 174, 201, 255
  - Fix [engine.ts](src/game/engine.ts) line 51
  - Update `Level` type to include `name`, `maxData`, etc.

- [ ] **3. Delete [placeholder.ts](src/game/placeholder.ts)** (duplicate file)

### 🟠 High Priority

- [ ] **4. Add proper env var validation in [supabase.ts](src/lib/supabase.ts)**
- [ ] **5. Fix silent error swallowing** - add proper error handling or explicit comments
- [ ] **6. Remove or complete empty levels 11-14** in [levels.ts](src/game/levels.ts)

### 🟡 Medium Priority

- [ ] **7. Consolidate condition-checking logic** - use single `checkCondition()` from [conditions.ts](src/game/conditions.ts)
- [ ] **8. Extract shared utilities** - `countInitialData()`, grid traversal for win-check
- [ ] **9. Clean up unused files** - evaluate if [actions.ts](src/game/actions.ts) and [program.ts](src/game/program.ts) are needed

### 🔵 Low Priority (Refactoring)

- [ ] **10. Split [ActionBar.tsx](src/components/Game/ActionBar.tsx)** into smaller components
- [ ] **11. Consider Zustand slices** for [useGameStore.ts](src/store/useGameStore.ts)

---

## 📊 Summary Statistics

| Metric                     | Count                                               |
| -------------------------- | --------------------------------------------------- |
| `as any` usages            | 8                                                   |
| `: any` type annotations   | 1                                                   |
| Duplicate type definitions | 6 types × 2-3 duplicates                            |
| Duplicate files            | 1 (placeholder.ts)                                  |
| Duplicate functions        | 3 (condition checking, countInitialData, win-check) |
| Silent error catches       | 6                                                   |
| Empty/broken levels        | 4                                                   |
| Files needing split        | 3                                                   |

---

## 🏗️ Recommended Type Architecture

```
src/game/
├── types.ts          ← ALL type definitions (single source of truth)
├── conditions.ts     ← Pure condition evaluation (imports from types.ts)
├── engine.ts         ← Game engine (imports from types.ts)
├── runProgram.ts     ← Async runner (imports from types.ts, conditions.ts)
├── levels.ts         ← Level data (imports Level from types.ts)
└── utils.ts          ← Shared utilities (countInitialData, gridHelpers)

DELETE:
├── actions.ts        ← Merge into types.ts
├── program.ts        ← Merge into types.ts
└── placeholder.ts    ← Duplicate, delete entirely
```

---

**End of Report**
