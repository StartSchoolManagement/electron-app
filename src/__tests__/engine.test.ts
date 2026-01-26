// src/__tests__/engine.test.ts
// Tests for the game engine execution logic

import { describe, it, expect } from 'vitest'
import { executeProgram } from '@/game/engine'
import { Level, PlayerState, ProgramNode, Direction } from '@/game/types'

// Helper to create a minimal level
function createLevel(layout: string[], overrides: Partial<Level> = {}): Level {
  return {
    name: 'Test Level',
    allowedActionsCount: 7,
    maxActions: 7,
    layout,
    ...overrides,
  }
}

// Helper to create initial player state from level
function createPlayerFromLevel(level: Level): PlayerState {
  for (let y = 0; y < level.layout.length; y++) {
    const x = level.layout[y].indexOf('7')
    if (x !== -1) {
      return {
        x,
        y,
        direction: 'up',
        carrying: false,
      }
    }
  }
  throw new Error('No start position found in level')
}

describe('executeProgram', () => {
  describe('movement', () => {
    it('should move forward on vertical lane', () => {
      const level = createLevel([
        '01',
        '01',
        '07',
      ])
      const player = createPlayerFromLevel(level)
      const program: ProgramNode[] = [
        { type: 'action', action: 'forward' },
      ]

      const result = executeProgram(level, program, player)

      expect(result).toEqual({
        x: 1,
        y: 1,
        direction: 'up',
        carrying: false,
      })
    })

    it('should die when moving into void', () => {
      const level = createLevel([
        '00',
        '07',
      ])
      const player = createPlayerFromLevel(level)
      const program: ProgramNode[] = [
        { type: 'action', action: 'forward' },
      ]

      const result = executeProgram(level, program, player)

      expect(result).toBe('dead')
    })

    it('should die when moving out of bounds', () => {
      const level = createLevel([
        '07',
      ])
      const player = createPlayerFromLevel(level)
      const program: ProgramNode[] = [
        { type: 'action', action: 'forward' },
      ]

      const result = executeProgram(level, program, player)

      expect(result).toBe('dead')
    })
  })

  describe('turning', () => {
    it('should turn left correctly', () => {
      const level = createLevel([
        '7',
      ])
      const player = createPlayerFromLevel(level)
      const program: ProgramNode[] = [
        { type: 'action', action: 'left' },
      ]

      const result = executeProgram(level, program, player)

      expect(result).not.toBe('dead')
      expect((result as PlayerState).direction).toBe('left')
    })

    it('should turn right correctly', () => {
      const level = createLevel([
        '7',
      ])
      const player = createPlayerFromLevel(level)
      const program: ProgramNode[] = [
        { type: 'action', action: 'right' },
      ]

      const result = executeProgram(level, program, player)

      expect(result).not.toBe('dead')
      expect((result as PlayerState).direction).toBe('right')
    })

    it('should complete 360 degree turn with 4 lefts', () => {
      const level = createLevel([
        '7',
      ])
      const player = createPlayerFromLevel(level)
      const program: ProgramNode[] = [
        { type: 'action', action: 'left' },
        { type: 'action', action: 'left' },
        { type: 'action', action: 'left' },
        { type: 'action', action: 'left' },
      ]

      const result = executeProgram(level, program, player)

      expect(result).not.toBe('dead')
      expect((result as PlayerState).direction).toBe('up')
    })
  })

  describe('pickup and putdown', () => {
    it('should pick up data from data cell', () => {
      const level = createLevel([
        '08',
        '07',
      ])
      const player = createPlayerFromLevel(level)
      const program: ProgramNode[] = [
        { type: 'action', action: 'forward' },
        { type: 'action', action: 'pickup' },
      ]

      const result = executeProgram(level, program, player)

      expect(result).not.toBe('dead')
      expect((result as PlayerState).carrying).toBe(true)
    })

    it('should not pick up from non-data cell', () => {
      const level = createLevel([
        '01',
        '07',
      ])
      const player = createPlayerFromLevel(level)
      const program: ProgramNode[] = [
        { type: 'action', action: 'forward' },
        { type: 'action', action: 'pickup' },
      ]

      const result = executeProgram(level, program, player)

      expect(result).not.toBe('dead')
      expect((result as PlayerState).carrying).toBe(false)
    })

    it('should win when placing data on all targets', () => {
      const level = createLevel([
        '09',
        '08',
        '07',
      ], { maxData: 1 })
      const player = createPlayerFromLevel(level)
      const program: ProgramNode[] = [
        { type: 'action', action: 'forward' },
        { type: 'action', action: 'pickup' },
        { type: 'action', action: 'forward' },
        { type: 'action', action: 'putdown' },
      ]

      const result = executeProgram(level, program, player)

      expect(result).toBe('won')
    })

    it('should not place data when not carrying', () => {
      const level = createLevel([
        '09',
        '07',
      ])
      const player = createPlayerFromLevel(level)
      const program: ProgramNode[] = [
        { type: 'action', action: 'forward' },
        { type: 'action', action: 'putdown' },
      ]

      const result = executeProgram(level, program, player)

      expect(result).not.toBe('won')
      expect((result as PlayerState).carrying).toBe(false)
    })
  })

  describe('loops', () => {
    it('should respect maxSteps limit in infinite loop', () => {
      const level = createLevel([
        '7',
      ])
      const player = createPlayerFromLevel(level)
      const program: ProgramNode[] = [
        { type: 'action', action: 'left' },
        { type: 'loop' },
      ]

      // Should not hang, should return after maxSteps
      const result = executeProgram(level, program, player, 10)

      // After 10 steps of turning left, should have cycled through directions
      expect(result).not.toBe('dead')
    })
  })

  describe('conditionals', () => {
    it('should execute then block when condition is true', () => {
      const level = createLevel([
        '08',
        '07',
      ])
      const player = createPlayerFromLevel(level)
      const program: ProgramNode[] = [
        { type: 'action', action: 'forward' },
        {
          type: 'if',
          condition: 'onData',
          then: { type: 'action', action: 'pickup' },
        },
      ]

      const result = executeProgram(level, program, player)

      expect(result).not.toBe('dead')
      expect((result as PlayerState).carrying).toBe(true)
    })

    it('should skip then block when condition is false', () => {
      const level = createLevel([
        '01',
        '07',
      ])
      const player = createPlayerFromLevel(level)
      // Create a player that is already carrying
      const carryingPlayer = { ...player, carrying: true }
      const program: ProgramNode[] = [
        { type: 'action', action: 'forward' },
        {
          type: 'if',
          condition: 'onData', // Will be false since on '1' not '8'
          then: { type: 'action', action: 'left' },
        },
      ]

      const result = executeProgram(level, program, carryingPlayer)

      expect(result).not.toBe('dead')
      // Direction should still be 'up' since condition was false
      expect((result as PlayerState).direction).toBe('up')
    })

    it('should handle array of conditions (AND logic)', () => {
      const level = createLevel([
        '08',
        '07',
      ])
      const player = createPlayerFromLevel(level)
      const carryingPlayer = { ...player, carrying: true }

      const program: ProgramNode[] = [
        { type: 'action', action: 'forward' },
        {
          type: 'if',
          condition: ['onData', 'carrying'],
          then: { type: 'action', action: 'left' },
        },
      ]

      const result = executeProgram(level, program, carryingPlayer)

      expect(result).not.toBe('dead')
      // Both conditions met (on data + carrying), so should have turned left
      expect((result as PlayerState).direction).toBe('left')
    })
  })

  describe('direction movements', () => {
    it('should move in all directions correctly', () => {
      const level = createLevel([
        '666',
        '676',
        '666',
      ])

      const directions: Direction[] = ['up', 'right', 'down', 'left']
      const expected = [
        { x: 1, y: 0 }, // up
        { x: 2, y: 1 }, // right
        { x: 1, y: 2 }, // down
        { x: 0, y: 1 }, // left
      ]

      directions.forEach((dir, i) => {
        const player: PlayerState = { x: 1, y: 1, direction: dir, carrying: false }
        const program: ProgramNode[] = [{ type: 'action', action: 'forward' }]

        const result = executeProgram(level, program, player)

        expect(result).not.toBe('dead')
        expect((result as PlayerState).x).toBe(expected[i].x)
        expect((result as PlayerState).y).toBe(expected[i].y)
      })
    })
  })
})
