// src/__tests__/levels.test.ts
// Level validation tests - ensures all levels are correctly structured

import { describe, it, expect } from 'vitest'
import { levels } from '@/game/levels'
import { Level } from '@/game/types'

// Valid cell characters
const VALID_CELLS = new Set([
  '0', // void
  '1', // vertical lane
  '2', // corner up-right
  '3', // corner right-down
  '4', // corner down-left
  '5', // corner left-up
  '6', // horizontal lane
  '7', // start
  '8', // data
  '9', // empty data target
  '+', // cross lane
  'e', // empty (picked up data)
  // Teleports A-Z
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
])

/**
 * Validates a single level structure
 * 
 * Teleport system: A -> B -> C -> D, etc. (chain system)
 * Stepping on A takes you to B, stepping on B takes you to C, etc.
 * Teleports must be consecutive letters starting from A with no gaps.
 * Example: A,B,C,D is valid. A,B,D is invalid (missing C).
 */
function validateLevel(level: Level, index: number): string[] {
  const errors: string[] = []
  const prefix = `Level ${index + 1} (${level.name})`

  // Check required properties
  if (!level.name || typeof level.name !== 'string') {
    errors.push(`${prefix}: missing or invalid 'name' property`)
  }

  if (typeof level.allowedActionsCount !== 'number' || level.allowedActionsCount < 1) {
    errors.push(`${prefix}: 'allowedActionsCount' must be a positive number`)
  }

  if (typeof level.maxActions !== 'number' || level.maxActions < 1) {
    errors.push(`${prefix}: 'maxActions' must be a positive number`)
  }

  if (!Array.isArray(level.layout) || level.layout.length === 0) {
    errors.push(`${prefix}: 'layout' must be a non-empty array of strings`)
    return errors
  }

  // Check layout consistency
  const width = level.layout[0].length
  let startCount = 0
  let dataCount = 0
  let emptyTargetCount = 0
  const teleportCells: Set<string> = new Set()

  for (let y = 0; y < level.layout.length; y++) {
    const row = level.layout[y]

    // Check row width consistency
    if (row.length !== width) {
      errors.push(
        `${prefix}: row ${y} has width ${row.length}, expected ${width}`
      )
    }

    // Validate each cell
    for (let x = 0; x < row.length; x++) {
      const cell = row[x]

      if (!VALID_CELLS.has(cell)) {
        errors.push(`${prefix}: invalid cell '${cell}' at position (${x}, ${y})`)
      }

      if (cell === '7') {
        startCount++
      } else if (cell === '8') {
        dataCount++
      } else if (cell === '9') {
        emptyTargetCount++
      } else if (/^[A-Z]$/.test(cell)) {
        teleportCells.add(cell)
      }
    }
  }

  // Validate start position
  if (startCount !== 1) {
    errors.push(
      `${prefix}: must have exactly 1 start position ('7'), found ${startCount}`
    )
  }

  // Validate data/targets
  if (dataCount === 0 && emptyTargetCount === 0) {
    errors.push(`${prefix}: must have at least one data ('8') or target ('9')`)
  }

  // Validate teleport chain (must be consecutive letters, no gaps)
  // Can start anywhere in alphabet (e.g., A-B-C-D or E-F-G-H)
  // Stepping on A takes you to B, B takes you to C, etc.
  if (teleportCells.size > 0) {
    const sortedTeleports = Array.from(teleportCells).sort()
    const firstCharCode = sortedTeleports[0].charCodeAt(0)
    
    // Check for gaps - each letter should be consecutive from the starting letter
    for (let i = 0; i < sortedTeleports.length; i++) {
      const expectedLetter = String.fromCharCode(firstCharCode + i)
      if (sortedTeleports[i] !== expectedLetter) {
        errors.push(
          `${prefix}: teleport chain has gap - expected '${expectedLetter}' but found '${sortedTeleports[i]}' (teleports must be consecutive with no gaps)`
        )
        break // Only report first gap
      }
    }
  }

  // Validate maxData if specified
  if (level.maxData !== undefined) {
    if (typeof level.maxData !== 'number' || level.maxData < 1) {
      errors.push(`${prefix}: 'maxData' must be a positive number when specified`)
    }
  }

  return errors
}

describe('Level Validation', () => {
  it('should have at least one level defined', () => {
    expect(levels.length).toBeGreaterThan(0)
  })

  it('should have unique level names', () => {
    const names = levels.map((l) => l.name)
    const uniqueNames = new Set(names)
    expect(uniqueNames.size).toBe(names.length)
  })

  it('should have levels in order', () => {
    for (let i = 0; i < levels.length; i++) {
      expect(levels[i].name).toContain(`Level ${i + 1}`)
    }
  })

  describe('Individual Level Structure', () => {
    levels.forEach((level, index) => {
      it(`Level ${index + 1} (${level.name}) should be valid`, () => {
        const errors = validateLevel(level, index)
        expect(errors).toEqual([])
      })
    })
  })

  describe('Level Properties', () => {
    levels.forEach((level, index) => {
      describe(`Level ${index + 1} (${level.name})`, () => {
        it('should have valid allowedActionsCount', () => {
          expect(level.allowedActionsCount).toBeGreaterThan(0)
          expect(level.allowedActionsCount).toBeLessThanOrEqual(20)
        })

        it('should have valid maxActions', () => {
          expect(level.maxActions).toBeGreaterThan(0)
          expect(level.maxActions).toBeLessThanOrEqual(20)
        })

        it('should have consistent row widths in layout', () => {
          const width = level.layout[0].length
          level.layout.forEach((row) => {
            expect(row.length).toBe(width)
          })
        })

        it('should have exactly one start position', () => {
          const startCount = level.layout.join('').split('7').length - 1
          expect(startCount).toBe(1)
        })
      })
    })
  })
})

describe('Level Helper Functions', () => {
  it('should be able to find start position in any level', () => {
    levels.forEach((level) => {
      let found = false
      for (let y = 0; y < level.layout.length; y++) {
        const x = level.layout[y].indexOf('7')
        if (x !== -1) {
          found = true
          break
        }
      }
      expect(found).toBe(true)
    })
  })

  it('should have valid walkable paths from start', () => {
    // For each level, verify start is not completely surrounded by void
    levels.forEach((level) => {
      let startX = -1
      let startY = -1

      for (let y = 0; y < level.layout.length; y++) {
        const x = level.layout[y].indexOf('7')
        if (x !== -1) {
          startX = x
          startY = y
          break
        }
      }

      // Check if at least one adjacent cell is walkable (not void)
      const adjacent = [
        { x: startX, y: startY - 1 }, // up
        { x: startX + 1, y: startY }, // right
        { x: startX, y: startY + 1 }, // down
        { x: startX - 1, y: startY }, // left
      ]

      const hasWalkableAdjacent = adjacent.some(({ x, y }) => {
        if (y < 0 || y >= level.layout.length) return false
        if (x < 0 || x >= level.layout[y].length) return false
        const cell = level.layout[y][x]
        return cell !== '0'
      })

      expect(hasWalkableAdjacent).toBe(true)
    })
  })
})
