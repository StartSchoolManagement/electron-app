// src/components/Game/Grid.tsx

'use client'

import { useGameStore } from '@/store/useGameStore'
import Cell from './Cell'

const TILE = 48

export default function Grid() {
  const { grid, player, dead } = useGameStore()

  return (
    <div
      className={`grid ${dead ? 'opacity-60 shake-electric' : ''}`}
      style={{
        gridTemplateColumns: `repeat(${grid[0].length}, ${TILE}px)`,
      }}
    >
      {grid.map((row, y) =>
        row.map((cell, x) => (
          <Cell
            key={`${x}-${y}`}
            type={cell}
            hasPlayer={player.x === x && player.y === y}
            direction={player.direction}
            carrying={player.carrying}
          />
        ))
      )}
    </div>
  )
}
