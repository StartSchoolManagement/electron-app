// src/store/useGameStore.ts

import { create } from 'zustand'
import { levels } from '@/game/levels'
import { ProgramNode, PlayerState, Grid } from '@/game/types'
import { supabase } from '@/lib/supabase'

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

  setScreen: (s: Screen) => void

  addNode: (node: ProgramNode) => void
  setNodeAt: (index: number, node: ProgramNode) => void
  insertNodeAt: (index: number, node: ProgramNode) => void

  resetProgram: () => void
  resetPlayer: () => void
  setPlayer: (p: PlayerState) => void
  setRunning: (v: boolean) => void
  setDead: () => void
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

  setScreen: (screen) => {
    set({ screen })
    if (screen === 'game') set({ scoreSubmitted: false })
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

  // submit score to leaderboard
  submitScore: async () => {
    // don't submit twice
    if (get().scoreSubmitted) return
    if (typeof window === 'undefined') return

    const name = localStorage.getItem('playerName')?.trim()
    if (!name) return

    const { totalScore } = get()
    try {
      const { error } = await supabase.from('leaderboard').insert({ name, score: totalScore })
      if (error) throw error
      set({ scoreSubmitted: true })
      // clean pending if present
      localStorage.removeItem('pendingScore')
    } catch {
      // if failed, save locally so we can retry on next load
      try {
        localStorage.setItem('pendingScore', JSON.stringify({ name, score: totalScore, ts: Date.now() }))
      } catch { /* localStorage may be unavailable */ }
    }
  },

  submitPending: async () => {
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem('pendingScore')
    if (!raw) return
    try {
      const pending = JSON.parse(raw) as { name?: string; score?: number }
      if (!pending?.name || typeof pending?.score !== 'number') return
      const { error } = await supabase.from('leaderboard').insert({ name: pending.name, score: pending.score })
      if (!error) {
        localStorage.removeItem('pendingScore')
        set({ scoreSubmitted: true })
      }
    } catch { /* JSON parse failed or insert failed */ }
  },

  // quit out to start screen and add points (set level score to 1 on quit)
  quitLevel: () => {
    // finalize with 1 point for the current level
    const state = get()
    state.finalizeLevelScore(1)

    // If we are beyond level 1, attempt to submit immediately; do not upload if quitting at level 1
    if (state.levelIndex > 0) {
      state.submitScore()
    }

    set({ screen: 'start' })
    get().resetProgram()
    get().resetPlayer()
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

  setPlayer: (player) => set({ player }),
  setRunning: (running) => {
    set({ running })
    if (!running) set({ executingIndex: null })
    if (running) get().startScoring()
    else get().stopScoring()
  },
  setDead: () => set({ running: false, dead: true }),
  setWon: () => {
    // finalize score and stop timer
    get().stopScoring()
    get().finalizeLevelScore()
    set({ running: false, won: true })
  },
}))
