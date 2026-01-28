'use client'

import { useGameStore } from '@/store/useGameStore'
import { levels } from '@/game/levels'

export default function VictoryModal() {
  const { levelIndex, levelScores, totalScore, nextLevel, quitLevel, clearWin } = useGameStore()
  const last = levelScores[levelScores.length - 1] ?? 0
  const isLastLevel = levelIndex >= levels.length - 1

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
      <div className="w-full max-w-3xl mx-4 rounded-2xl border border-cyan-400/30 bg-slate-900/95 p-8 text-center text-cyan-100 shadow-2xl">
        <h3 className="mb-4 text-2xl uppercase tracking-widest text-cyan-300">circuit complete</h3>
        <p className="mb-4 text-lg text-slate-300">Level points: <strong className="text-cyan-200">{last}</strong></p>
        <p className="mb-6 text-lg text-slate-300">Total points: <strong className="text-cyan-200">{totalScore}</strong></p>

        <div className="flex justify-center gap-6">
          <button
            className="rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLastLevel}
            onClick={() => {
              clearWin()
              nextLevel()
            }}
          >
            Continue
          </button>

          <button
            className="rounded-2xl border border-red-400/40 px-6 py-3 text-sm text-red-300 hover:bg-red-400/10"
            onClick={() => quitLevel()}
          >
            Quit
          </button>
        </div>
      </div>
    </div>
  )
}