// src/game/conditions.ts
// Single source of truth for condition evaluation logic

import { Condition, PlayerState, Grid } from './types'

// Re-export Condition for backward compatibility
export type { Condition } from './types'

/**
 * Pure condition evaluator against a mutable grid.
 * Used by both sync and async engine execution.
 * No side effects. No mutation. Always safe.
 * 
 * @param condition - Single condition or array of conditions (AND logic)
 * @param grid - The current grid state (2D string array)
 * @param player - Current player state
 */
export function checkCondition(
  condition: Condition | Condition[],
  grid: Grid,
  player: PlayerState
): boolean {
  // Support AND of multiple conditions
  if (Array.isArray(condition)) {
    return condition.every((c) => checkCondition(c, grid, player))
  }

  const tile = grid[player.y]?.[player.x] ?? null

  switch (condition) {
    case 'onData':
      return tile === '8'

    case 'onEmpty':
      return tile === '9'

    case 'carrying':
      return player.carrying

    case 'onCorner':
      return tile === '2' || tile === '3' || tile === '4' || tile === '5'

    case 'onCornerUp':
      return tile === '3'

    case 'onCornerDown':
      return tile === '5'

    case 'onCornerLeft':
      return tile === '4'

    case 'onCornerRight':
      return tile === '2'

    default:
      return false
  }
}
