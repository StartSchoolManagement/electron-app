'use client'

import { useGameStore } from '@/store/useGameStore'
import { levels } from '@/game/levels'

function getPlayerName(): string {
  if (typeof window === 'undefined') return 'Player'
  return localStorage.getItem('playerName') || 'Player'
}

export default function QuitModal() {
  const { levelIndex, levelScores, totalScore, currentPoints, confirmQuit, cancelQuit } = useGameStore()
  const playerName = getPlayerName()

  const currentLevel = levels[levelIndex]
  const levelsCompleted = levelScores.length

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
      <div className="w-full max-w-md mx-4 rounded-2xl border border-cyan-400/30 bg-slate-900/95 p-8 text-center text-cyan-100 shadow-2xl">
        <h3 className="mb-2 text-2xl uppercase tracking-widest text-cyan-300">
          Great Progress!
        </h3>
        
        <p className="mb-6 text-lg text-slate-300">
          Congrats <span className="text-cyan-200 font-semibold">{playerName}</span>, you got this far!
        </p>

        <div className="mb-6 space-y-3 text-left bg-slate-800/50 rounded-xl p-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Current Level:</span>
            <span className="text-cyan-200 font-medium">{currentLevel.name}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Level Number:</span>
            <span className="text-cyan-200 font-medium">{levelIndex + 1} / {levels.length}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Levels Completed:</span>
            <span className="text-cyan-200 font-medium">{levelsCompleted}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Current Level Points:</span>
            <span className="text-cyan-200 font-medium">{currentPoints}</span>
          </div>

          <div className="border-t border-slate-700 pt-3 flex justify-between text-sm">
            <span className="text-slate-400">Total Score:</span>
            <span className="text-cyan-300 font-bold text-lg">{totalScore}</span>
          </div>
        </div>

        {levelsCompleted > 0 && (
          <div className="mb-6 text-xs text-slate-400">
            Level scores: {levelScores.join(' + ')} = {totalScore}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            className="w-full rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-300"
            onClick={confirmQuit}
          >
            Back to Menu
          </button>

          <button
            className="w-full rounded-2xl border border-slate-600 px-6 py-3 text-sm text-slate-300 hover:bg-slate-800"
            onClick={cancelQuit}
          >
            Continue Playing
          </button>
        </div>
      </div>
    </div>
  )
}
