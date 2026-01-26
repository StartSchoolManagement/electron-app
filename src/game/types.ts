// src/game/types.ts
// SINGLE SOURCE OF TRUTH for all game types

export type CellType = string // '0' void, '1' vertical lane, '6' horizontal, '7' start, '8' data, '9' empty target, 'A'..'Z' teleports

export type Direction = 'up' | 'right' | 'down' | 'left'

export type PrimitiveAction =
  | 'forward'
  | 'left'
  | 'right'
  | 'pickup'
  | 'putdown'

export type Condition =
  | 'onData'
  | 'onEmpty'
  | 'carrying'
  | 'onCorner'
  | 'onCornerUp'
  | 'onCornerDown'
  | 'onCornerLeft'
  | 'onCornerRight'

export type ProgramNode =
  | { type: 'action'; action: PrimitiveAction }
  | { type: 'loop' }
  | { type: 'if'; condition: Condition | Condition[]; then: ProgramNode }

export interface PlayerState {
  x: number
  y: number
  direction: Direction
  carrying: boolean
}

export interface Teleport {
  from: { x: number; y: number }
  to: { x: number; y: number }
}

export interface Level {
  name: string
  allowedActionsCount: number
  maxActions: number
  maxData?: number
  layout: string[]
  teleports?: Teleport[]
}

// Utility type for grid operations
export type Grid = string[][]  
