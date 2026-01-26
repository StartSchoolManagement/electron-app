// src/__tests__/conditions.test.ts
// Tests for the condition evaluation logic

import { describe, it, expect } from 'vitest'
import { checkCondition } from '@/game/conditions'
import { PlayerState, Grid, Condition } from '@/game/types'

// Helper to create a player state
function createPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    x: 1,
    y: 1,
    direction: 'up',
    carrying: false,
    ...overrides,
  }
}

// Helper to create a simple test grid
function createGrid(cells: string[][]): Grid {
  return cells
}

describe('checkCondition', () => {
  describe('onData condition', () => {
    it('should return true when player is on data cell (8)', () => {
      const grid = createGrid([
        ['0', '1', '0'],
        ['0', '8', '0'],
        ['0', '1', '0'],
      ])
      const player = createPlayer({ x: 1, y: 1 })

      expect(checkCondition('onData', grid, player)).toBe(true)
    })

    it('should return false when player is not on data cell', () => {
      const grid = createGrid([
        ['0', '1', '0'],
        ['0', '1', '0'],
        ['0', '1', '0'],
      ])
      const player = createPlayer({ x: 1, y: 1 })

      expect(checkCondition('onData', grid, player)).toBe(false)
    })

    it('should return false when player is on empty target (9)', () => {
      const grid = createGrid([
        ['0', '1', '0'],
        ['0', '9', '0'],
        ['0', '1', '0'],
      ])
      const player = createPlayer({ x: 1, y: 1 })

      expect(checkCondition('onData', grid, player)).toBe(false)
    })
  })

  describe('onEmpty condition', () => {
    it('should return true when player is on empty target (9)', () => {
      const grid = createGrid([
        ['0', '1', '0'],
        ['0', '9', '0'],
        ['0', '1', '0'],
      ])
      const player = createPlayer({ x: 1, y: 1 })

      expect(checkCondition('onEmpty', grid, player)).toBe(true)
    })

    it('should return false when player is not on empty target', () => {
      const grid = createGrid([
        ['0', '1', '0'],
        ['0', '8', '0'],
        ['0', '1', '0'],
      ])
      const player = createPlayer({ x: 1, y: 1 })

      expect(checkCondition('onEmpty', grid, player)).toBe(false)
    })
  })

  describe('carrying condition', () => {
    it('should return true when player is carrying data', () => {
      const grid = createGrid([['1']])
      const player = createPlayer({ x: 0, y: 0, carrying: true })

      expect(checkCondition('carrying', grid, player)).toBe(true)
    })

    it('should return false when player is not carrying data', () => {
      const grid = createGrid([['1']])
      const player = createPlayer({ x: 0, y: 0, carrying: false })

      expect(checkCondition('carrying', grid, player)).toBe(false)
    })
  })

  describe('onCorner conditions', () => {
    it('should return true for onCorner on any corner tile', () => {
      const corners = ['2', '3', '4', '5']
      corners.forEach((corner) => {
        const grid = createGrid([[corner]])
        const player = createPlayer({ x: 0, y: 0 })

        expect(checkCondition('onCorner', grid, player)).toBe(true)
      })
    })

    it('should return false for onCorner on non-corner tile', () => {
      const nonCorners = ['0', '1', '6', '7', '8', '9']
      nonCorners.forEach((cell) => {
        const grid = createGrid([[cell]])
        const player = createPlayer({ x: 0, y: 0 })

        expect(checkCondition('onCorner', grid, player)).toBe(false)
      })
    })

    it('should return true for onCornerUp on tile 3 (right-down corner)', () => {
      const grid = createGrid([['3']])
      const player = createPlayer({ x: 0, y: 0 })

      expect(checkCondition('onCornerUp', grid, player)).toBe(true)
    })

    it('should return true for onCornerDown on tile 5 (left-up corner)', () => {
      const grid = createGrid([['5']])
      const player = createPlayer({ x: 0, y: 0 })

      expect(checkCondition('onCornerDown', grid, player)).toBe(true)
    })

    it('should return true for onCornerLeft on tile 4 (down-left corner)', () => {
      const grid = createGrid([['4']])
      const player = createPlayer({ x: 0, y: 0 })

      expect(checkCondition('onCornerLeft', grid, player)).toBe(true)
    })

    it('should return true for onCornerRight on tile 2 (up-right corner)', () => {
      const grid = createGrid([['2']])
      const player = createPlayer({ x: 0, y: 0 })

      expect(checkCondition('onCornerRight', grid, player)).toBe(true)
    })
  })

  describe('array of conditions (AND logic)', () => {
    it('should return true when all conditions are met', () => {
      const grid = createGrid([['8']])
      const player = createPlayer({ x: 0, y: 0, carrying: true })

      const conditions: Condition[] = ['onData', 'carrying']
      expect(checkCondition(conditions, grid, player)).toBe(true)
    })

    it('should return false when any condition is not met', () => {
      const grid = createGrid([['8']])
      const player = createPlayer({ x: 0, y: 0, carrying: false })

      const conditions: Condition[] = ['onData', 'carrying']
      expect(checkCondition(conditions, grid, player)).toBe(false)
    })

    it('should return true for empty array (vacuously true)', () => {
      const grid = createGrid([['1']])
      const player = createPlayer()

      expect(checkCondition([], grid, player)).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle player at position outside grid bounds', () => {
      const grid = createGrid([['1']])
      const player = createPlayer({ x: 10, y: 10 })

      // Should return false for all position-dependent conditions
      expect(checkCondition('onData', grid, player)).toBe(false)
      expect(checkCondition('onEmpty', grid, player)).toBe(false)
      expect(checkCondition('onCorner', grid, player)).toBe(false)
    })

    it('should handle player at negative position', () => {
      const grid = createGrid([['8']])
      const player = createPlayer({ x: -1, y: -1 })

      expect(checkCondition('onData', grid, player)).toBe(false)
    })

    it('should return false for unknown condition', () => {
      const grid = createGrid([['1']])
      const player = createPlayer()

      // @ts-expect-error - testing invalid condition
      expect(checkCondition('unknownCondition', grid, player)).toBe(false)
    })
  })
})
