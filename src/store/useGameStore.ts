// src/store/useGameStore.ts

import { create } from 'zustand'
import { levels } from '@/game/levels'
import { ProgramNode, PlayerState, Grid } from '@/game/types'

type Screen = 'start' | 'game'

interface GameState {
  screen: Screen
  levelIndex: number

  program: ProgramNode[]

  grid: Grid
  initialGrid: Grid
  setGrid: (g: string[][]) => void
  setGridCell: (x: number, y: number, v: string) => void
  player: PlayerState

  running: boolean
  dead: boolean
  won: boolean

  // currently executing instruction index (UI)
  executingIndex: number | null
  setExecutingIndex: (i: number | null) => void

  // scoring
  currentPoints: number
  totalScore: number
  levelScores: number[]
  scoringIntervalId?: number | null
  startScoring: () => void
  stopScoring: () => void
  finalizeLevelScore: (value?: number) => void
  quitLevel: () => void
  clearWin: () => void
  nextLevel: () => void

  // leaderboard submission
  scoreSubmitted: boolean
  submitScore: () => Promise<void>
  submitPending: () => Promise<void>

  // quit modal
  showQuitModal: boolean
  showQuitConfirm: () => void
  confirmQuit: () => Promise<void>
  cancelQuit: () => void

  setScreen: (s: Screen) => void

  addNode: (node: ProgramNode) => void
  setNodeAt: (index: number, node: ProgramNode) => void
  insertNodeAt: (index: number, node: ProgramNode) => void
  removeNodeAt: (index: number) => void

  resetProgram: () => void
  resetPlayer: () => void
  resetPlayerOnly: () => void
  setPlayer: (p: PlayerState) => void
  setRunning: (v: boolean) => void
  setDead: () => void
  clearDead: () => void
  setWon: () => void
}

function buildGrid(levelIndex: number): string[][] {
  return levels[levelIndex].layout.map((r) => r.split(''))
}

function findStart(levelIndex: number): PlayerState {
  const layout = levels[levelIndex].layout

  for (let y = 0; y < layout.length; y++) {
    const x = layout[y].indexOf('7')
    if (x !== -1) {
      return { x, y, direction: 'up', carrying: false }
    }
  }

  return { x: 0, y: 0, direction: 'up', carrying: false }
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'start',
  levelIndex: 0,

  program: [],

  grid: buildGrid(0),
  initialGrid: buildGrid(0),
  setGrid: (g) => set({ grid: g }),
  setGridCell: (x, y, v) => set((state) => {
    const g = state.grid.map((r) => r.slice())
    if (g[y] && typeof g[y][x] !== 'undefined') g[y][x] = v
    return { grid: g }
  }),
  player: findStart(0),

  running: false,
  dead: false,
  won: false,

  // UI: currently executing instruction slot index (or null)
  executingIndex: null,
  setExecutingIndex: (i: number | null) => set({ executingIndex: i }),

  // scoring defaults
  currentPoints: 300,
  totalScore: 0,
  levelScores: [],
  scoringIntervalId: null,
  scoreSubmitted: false,
  showQuitModal: false,

  // Show quit confirmation modal
  showQuitConfirm: () => {
    set({ running: false, showQuitModal: true })
  },

  // Actually quit after confirmation
  confirmQuit: async () => {
    const state = get()
    // Only finalize if the current level wasn't already won
    if (!state.won) {
      state.finalizeLevelScore(1)
    }

    // Always submit — even from level 1
    await state.submitScore()

    set({ screen: 'start', showQuitModal: false })
    get().resetProgram()
    get().resetPlayer()
  },

  // Cancel quit and continue playing
  cancelQuit: () => {
    set({ showQuitModal: false })
  },

  setScreen: (screen) => {
    set({ screen })
    if (screen === 'game') {
      set({ scoreSubmitted: false })
      // Clear any old pending score when starting a new game
      try { localStorage.removeItem('pendingScore') } catch { /* ignore */ }
      // Start scoring immediately when level loads
      get().startScoring()
    }
  },

  // ADD (append)
  addNode: (node) => {
    const { program, levelIndex } = get()
    const level = levels[levelIndex]
    if (program.length >= level.maxActions) return
    set({ program: [...program, node] })
  },

  // Insert at index (shifts later nodes to the right)
  insertNodeAt: (index, node) => {
    const { program, levelIndex } = get()
    const level = levels[levelIndex]
    if (program.length >= level.maxActions) return
    const next = [...program]
    const idx = Math.max(0, Math.min(index, next.length))
    next.splice(idx, 0, node)
    set({ program: next.slice(0, level.maxActions) })
  },

  // ✅ NEW: REPLACE (edit)
  setNodeAt: (index, node) => {
    const { program } = get()
    if (!program[index]) return
    const next = [...program]
    next[index] = node
    set({ program: next })
  },

  // Remove node at index (makes slot empty)
  removeNodeAt: (index) => {
    const { program } = get()
    if (index < 0 || index >= program.length) return
    const next = [...program]
    next.splice(index, 1)
    set({ program: next })
  },

  // Scoring controls
  startScoring: () => {
    if (get().scoringIntervalId) return
    const id = window.setInterval(() => {
      set((s) => ({ currentPoints: Math.max(100, s.currentPoints - 1) }))
    }, 1000)
    set({ scoringIntervalId: id })
  },

  stopScoring: () => {
    const id = get().scoringIntervalId
    if (id) {
      clearInterval(id)
      set({ scoringIntervalId: null })
    }
  },

  // finalize the level score. If `value` is provided, use that (e.g., 1 on quit)
  finalizeLevelScore: (value?: number) => {
    const { currentPoints, totalScore, levelScores } = get()
    get().stopScoring()
    const points = typeof value === 'number' ? value : currentPoints
    set({ totalScore: totalScore + points, levelScores: [...levelScores, points] })
  },

  // submit score to leaderboard via server API
  submitScore: async () => {
    if (get().scoreSubmitted) return
    set({ scoreSubmitted: true })

    if (typeof window === 'undefined') return

    const name = localStorage.getItem('playerName')?.trim()
    if (!name) return

    const email = localStorage.getItem('playerEmail')?.trim() || ''
    const { totalScore, levelIndex, levelScores } = get()
    const payload = {
      name,
      email,
      score: totalScore,
      level_reached: levelIndex + 1,
      levels_completed: levelScores.filter((s) => s > 1).length,
    }
    try {
      const res = await fetch('/api/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('submit failed')
      localStorage.removeItem('pendingScore')
    } catch {
      set({ scoreSubmitted: false })
      try {
        localStorage.setItem('pendingScore', JSON.stringify({ ...payload, ts: Date.now() }))
      } catch { /* localStorage may be unavailable */ }
    }
  },

  submitPending: async () => {
    if (typeof window === 'undefined') return
    if (get().scoreSubmitted) return
    const raw = localStorage.getItem('pendingScore')
    if (!raw) return

    set({ scoreSubmitted: true })

    try {
      const pending = JSON.parse(raw) as {
        name?: string; email?: string; score?: number;
        level_reached?: number; levels_completed?: number
      }
      if (!pending?.name || typeof pending?.score !== 'number') {
        set({ scoreSubmitted: false })
        return
      }
      const res = await fetch('/api/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pending.name,
          email: pending.email || '',
          score: pending.score,
          level_reached: pending.level_reached ?? 1,
          levels_completed: pending.levels_completed ?? 0,
        }),
      })
      if (res.ok) {
        localStorage.removeItem('pendingScore')
      } else {
        set({ scoreSubmitted: false })
      }
    } catch {
      set({ scoreSubmitted: false })
    }
  },

  // quit out to start screen and add points (set level score to 1 on quit)
  // Now shows confirmation modal first
  quitLevel: () => {
    get().showQuitConfirm()
  },

  // clear won flag so UI can continue
  clearWin: () => set({ won: false }),

  // move to next level if any
  nextLevel: () => {
    set((state) => {
      const next = Math.min(state.levelIndex + 1, levels.length - 1)
      return {
        levelIndex: next,
        player: findStart(next),
        grid: buildGrid(next),
        program: [],
        running: false,
        dead: false,
        won: false,
        currentPoints: 300,
      }
    })
    // Start scoring immediately when next level loads
    get().startScoring()
  },

  resetProgram: () =>
    set({
      program: [],
      running: false,
      dead: false,
      won: false,
    }),

  resetPlayer: () =>
    set((state) => ({
      player: findStart(state.levelIndex),
      grid: buildGrid(state.levelIndex),
      running: false,
      dead: false,
      won: false,
      currentPoints: 300,
    })),

  // Reset player position and grid only, keep program intact
  resetPlayerOnly: () =>
    set((state) => ({
      player: findStart(state.levelIndex),
      grid: buildGrid(state.levelIndex),
      running: false,
      dead: false,
      won: false,
    })),

  setPlayer: (player) => set({ player }),
  setRunning: (running) => {
    set({ running })
    if (!running) set({ executingIndex: null })
  },
  setDead: () => set({ running: false, dead: true }),
  clearDead: () => set({ dead: false }),
  setWon: () => {
    get().stopScoring()
    get().finalizeLevelScore()
    set({ running: false, won: true })

    // Auto-submit on last level since there's no "continue"
    const { levelIndex } = get()
    if (levelIndex >= levels.length - 1) {
      get().submitScore()
    }
  },
}))
