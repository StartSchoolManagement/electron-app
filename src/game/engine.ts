// src/game/engine.ts
// Combined game engine with sync execution and async UI runner

import {
  Direction,
  PrimitiveAction,
  ProgramNode,
  PlayerState,
  Level,
  Grid
} from './types'
import { checkCondition } from './conditions'

// Re-export types for backward compatibility
export type { Direction, PrimitiveAction, ProgramNode, PlayerState, Level } from './types'

export type EngineResult = PlayerState | 'dead' | 'won'

const STEP_DELAY = 500
const dirs: Direction[] = ['up', 'right', 'down', 'left']

/* ================================ */
/*       ASYNC UI RUNNER            */
/* ================================ */

export async function runProgram({
  level,
  program,
  player,
  onStep,
  onDead,
  onWin,
  onGridChange,
  onInstruction,
  speed = 1,
  shouldContinue,
  onTrace,
}: {
  level: Level
  program: ProgramNode[]
  player: PlayerState
  onStep: (p: PlayerState) => void
  onDead: () => void
  onWin: () => void
  onGridChange?: (g: Grid) => void
  onInstruction?: (idx: number | null) => void
  speed?: number
  shouldContinue?: () => boolean
  onTrace?: (msg: string) => void
}): Promise<void> {
  const trace = (m: string) => {
    if (onTrace) onTrace(m)
  }

  const tickSpeed = Math.max(1, Math.floor(speed))
  let state = { ...player }
  let pc = 0
  let safety = 0
  let stepCount = 0

  const grid = level.layout.map((r) => r.split(''))
  const required = level.maxData ?? countInitialData(grid)
  let placed = 0

  const hasLoop = program.some((n) => n.type === 'loop')
  const instructions = program.map((n, i) => ({ node: n, idx: i })).filter((p) => p.node.type !== 'loop')

  trace(`start level=${level.name} instructions=${instructions.length} hasLoop=${hasLoop}`)

  while (pc < instructions.length) {
    if (safety++ > 10000) {
      trace(`safety limit reached: ${safety}, aborting run`)
      if (onInstruction) onInstruction(null)
      return
    }

    if (shouldContinue && !shouldContinue()) {
      trace(`aborted before step pc=${pc}`)
      if (onInstruction) onInstruction(null)
      return
    }

    const { node, idx } = instructions[pc]

    if (onInstruction) onInstruction(idx)
    trace(`step ${stepCount} pc=${pc} idx=${idx} node=${JSON.stringify(node)}`)

    const prevTile = grid[state.y]?.[state.x]

    if (node.type === 'action' && node.action === 'forward') {
      const nextPos = move(state.x, state.y, state.direction)
      const targetTile = grid[nextPos.y]?.[nextPos.x] ?? null
      trace(`attempting forward to x=${nextPos.x} y=${nextPos.y} tile=${targetTile}`)
    }

    const result = executeNode(level, state, node, grid)

    if (result === 'dead') {
      let reason = 'unknown'
      if (node.type === 'action' && node.action === 'forward') {
        const nextPos = move(state.x, state.y, state.direction)
        const targetTile = grid[nextPos.y]?.[nextPos.x] ?? null
        if (!targetTile || targetTile === '0') reason = `moved into void at x=${nextPos.x} y=${nextPos.y}`
        else reason = `non-walkable tile '${targetTile}' at x=${nextPos.x} y=${nextPos.y}`
      }

      trace(`result: dead at step ${stepCount} pc=${pc} (${reason})`)
      if (onInstruction) onInstruction(null)
      onDead()
      return
    }

    if (typeof result === 'object') {
      state = result
      trace(`state updated: x=${state.x} y=${state.y} dir=${state.direction} carrying=${state.carrying}`)
      onStep({ ...state })
    }

    const newTile = grid[state.y]?.[state.x]
    if (prevTile === '9' && newTile === '8') {
      placed++
      trace(`putdown detected: placed=${placed} required=${required}`)
      if (required !== null && placed >= required) {
        trace(`won after step ${stepCount} pc=${pc}`)
        if (onInstruction) onInstruction(null)
        onWin()
        return
      }
    }

    if (onGridChange) onGridChange(grid.map((r) => r.slice()))

    await delay(Math.max(20, Math.floor(STEP_DELAY / tickSpeed)))

    if (shouldContinue && !shouldContinue()) {
      trace(`aborted after step ${stepCount} pc=${pc}`)
      if (onInstruction) onInstruction(null)
      return
    }

    pc++
    stepCount++

    if (pc >= instructions.length && hasLoop) {
      pc = 0
    }
  }

  if (onInstruction) onInstruction(null)
}

/* ================================ */
/*     SYNC EXECUTION ENGINE        */
/* ================================ */

export function executeProgram(
  level: Level,
  program: ProgramNode[],
  initial: PlayerState,
  maxSteps = 100,
  onTrace?: (msg: string) => void
): EngineResult {
  const trace = (m: string) => {
    if (onTrace) onTrace(m)
  }
  
  const grid = level.layout.map((r) => r.split(''))
  const orig = level.layout.map((r) => r.split(''))
  const required = level.maxData ?? countInitialData(grid)

  let state: PlayerState = { ...initial }
  let pc = 0
  let steps = 0

  while (pc < program.length) {
    trace(`pc=${pc} steps=${steps}`)
    if (steps++ >= maxSteps) return state

    const node = program[pc]

    if (node.type === 'loop') {
      pc = 0
      continue
    }

    if (node.type === 'if') {
      trace(`if at pc=${pc} condition=${JSON.stringify(node.condition)}`)
      if (checkCondition(node.condition, grid, state)) {
        const res = executeProgram(level, [node.then], state, maxSteps - steps, onTrace)
        if (res === 'dead') return res
        if (res === 'won') return 'won'
        state = res as PlayerState
      }
      pc++
      continue
    }

    const prevTile = grid[state.y]?.[state.x]
    trace(`executePrimitive at pc=${pc} action=${node.action} player=${JSON.stringify(state)} tile=${prevTile}`)
    const res = executePrimitive(level, state, node.action, grid, orig, required)
    if (res === 'dead') {
      trace(`result dead at pc=${pc}`)
      return res
    }
    if (res === 'won') {
      trace(`result won at pc=${pc}`)
      return 'won'
    }

    state = res as PlayerState
    pc++
  }

  return state
}

/* ================================ */
/*        HELPER FUNCTIONS          */
/* ================================ */

function executeNode(
  level: Level,
  state: PlayerState,
  node: ProgramNode,
  grid: Grid
): PlayerState | 'dead' | 'won' {
  let { x, y, direction, carrying } = state

  if (node.type === 'if') {
    if (checkCondition(node.condition, grid, state)) {
      const res = executeNode(level, state, node.then, grid)
      if (res === 'dead') return res
      return res
    }
    return state
  }

  if (node.type !== 'action') return state

  if (node.action === 'left') direction = turnLeft(direction)
  if (node.action === 'right') direction = turnRight(direction)

  if (node.action === 'forward') {
    const next = move(x, y, direction)
    const tile = grid[next.y]?.[next.x]
    if (!tile || tile === '0') return 'dead'
    x = next.x
    y = next.y

    // Alphabet teleports: A -> B, C -> D, etc.
    if (tile >= 'A' && tile <= 'Z') {
      const dest = String.fromCharCode(tile.charCodeAt(0) + 1)
      for (let yy = 0; yy < grid.length; yy++) {
        for (let xx = 0; xx < grid[yy].length; xx++) {
          if (grid[yy][xx] === dest) {
            x = xx
            y = yy
            yy = grid.length
            break
          }
        }
      }
    }
  }

  if (node.action === 'pickup') {
    if (grid[y][x] === '8' && !carrying) {
      carrying = true
      grid[y][x] = 'e'
    }
  }

  if (node.action === 'putdown') {
    if (grid[y][x] === '9' && carrying) {
      carrying = false
      grid[y][x] = '8'

      const required = level.maxData ?? countInitialData(level.layout.map((r) => r.split('')))
      let placed = 0
      const orig = level.layout.map((r) => r.split(''))
      for (let yy = 0; yy < grid.length; yy++) {
        for (let xx = 0; xx < grid[yy].length; xx++) {
          if (orig[yy]?.[xx] === '9' && grid[yy][xx] === '8') placed++
        }
      }
      if (placed >= required) return 'won'
    }
  }

  return { x, y, direction, carrying }
}

function executePrimitive(
  level: Level,
  state: PlayerState,
  action: PrimitiveAction,
  grid: Grid,
  orig: Grid,
  required: number
): EngineResult {
  const next: PlayerState = { ...state }

  if (action === 'left') {
    next.direction = dirs[(dirs.indexOf(next.direction) + 3) % 4]
    return next
  }

  if (action === 'right') {
    next.direction = dirs[(dirs.indexOf(next.direction) + 1) % 4]
    return next
  }

  if (action === 'forward') {
    if (next.direction === 'up') next.y--
    if (next.direction === 'down') next.y++
    if (next.direction === 'left') next.x--
    if (next.direction === 'right') next.x++

    const tile = grid[next.y]?.[next.x]
    if (!tile || tile === '0') return 'dead'

    if (tile === 'T' && level.teleports) {
      const map = level.teleports.find((m) => m.from.x === next.x && m.from.y === next.y)
      if (map) {
        next.x = map.to.x
        next.y = map.to.y
      }
    }

    return next
  }

  if (action === 'pickup') {
    const tile = grid[state.y]?.[state.x]
    if (tile === '8' && !state.carrying) {
      next.carrying = true
      grid[state.y][state.x] = 'e'
    }
    return next
  }

  if (action === 'putdown') {
    const tile = grid[state.y]?.[state.x]
    if (tile === '9' && state.carrying) {
      grid[state.y][state.x] = '8'

      let placed = 0
      for (let yy = 0; yy < grid.length; yy++) {
        for (let xx = 0; xx < grid[yy].length; xx++) {
          if (orig[yy]?.[xx] === '9' && grid[yy][xx] === '8') placed++
        }
      }

      if (placed >= required) return 'won'

      return { ...next, carrying: false }
    }
    return next
  }

  return next
}

function countInitialData(grid: Grid): number {
  let n = 0
  for (const r of grid) for (const c of r) if (c === '8') n++
  return n
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function move(x: number, y: number, d: Direction): { x: number; y: number } {
  if (d === 'up') return { x, y: y - 1 }
  if (d === 'down') return { x, y: y + 1 }
  if (d === 'left') return { x: x - 1, y }
  return { x: x + 1, y }
}

function turnLeft(d: Direction): Direction {
  return d === 'up' ? 'left' : d === 'left' ? 'down' : d === 'down' ? 'right' : 'up'
}

function turnRight(d: Direction): Direction {
  return d === 'up' ? 'right' : d === 'right' ? 'down' : d === 'down' ? 'left' : 'up'
}
