// src/components/Game/Controls.tsx
// MOBILE-FRIENDLY: stacked on mobile, inline on desktop

'use client'

import { useState } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { runProgram } from '@/game/engine'
import { levels } from '@/game/levels'

export default function Controls() {
  const {
    program,
    player,
    levelIndex,
    setPlayer,
    setDead,
    setWon,
    running,
    setRunning,
    resetProgram,
    resetPlayer,
    quitLevel,
    setGrid,
    setExecutingIndex,
  } = useGameStore()

  const [speed, setSpeed] = useState<number>(1)

  return (
    <div
      className="
        mt-6
        flex flex-col gap-3
        sm:flex-row sm:justify-center sm:gap-4
        px-2
      "
    >
      <div className="flex gap-2 items-center">
        <button
          className={`px-3 py-2 rounded-md text-xs font-semibold ${speed === 1 ? 'bg-cyan-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-700/10'}`}
          disabled={running}
          onClick={() => setSpeed(1)}
        >
          1x
        </button>
        <button
          className={`px-3 py-2 rounded-md text-xs font-semibold ${speed === 2 ? 'bg-cyan-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-700/10'}`}
          disabled={running}
          onClick={() => setSpeed(2)}
        >
          2x
        </button>
        <button
          className={`px-3 py-2 rounded-md text-xs font-semibold ${speed === 4 ? 'bg-cyan-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-700/10'}`}
          disabled={running}
          onClick={() => setSpeed(4)}
        >
          4x
        </button>
      </div>

      <button
        className=" w-full sm:w-auto rounded-xl bg-cyan-400 px-6 py-3 text-xs font-bold uppercase tracking-widest
          text-slate-950 disabled:opacity-50"
        disabled={running}
        onClick={async () => {
          setRunning(true)

          await runProgram({
            level: levels[levelIndex],
            program,
            player,
            onStep: setPlayer,
            onDead: () => {
              setDead()
              setRunning(false)
            },
            onWin: () => {
              setWon()
              setRunning(false)
            },
            onGridChange: (g) => setGrid(g),
            onInstruction: (idx) => setExecutingIndex(idx),
            speed,
            shouldContinue: () => useGameStore.getState().running,
          })

          setRunning(false)
        }}
      >
         run
      </button>

      <button
        className="
          w-full sm:w-auto
          rounded-xl border border-red-400/40
          bg-slate-900
          px-6 py-3
          text-xs uppercase tracking-wider
          text-red-300
          hover:bg-red-400/10
        "
        onClick={() => {
          setRunning(false)
          resetProgram()
          resetPlayer()
        }}
      >
        reset
      </button>

      <button
        className="
          w-full sm:w-auto
          rounded-xl border border-slate-700/40
          bg-slate-900
          px-6 py-3
          text-xs uppercase tracking-wider
          text-slate-300
          hover:bg-slate-700/10
        "
        onClick={() => {
          setRunning(false)
          quitLevel()
        }}
      >
        quit
      </button>

      {/* Full-width row below controls for external link */}
      <div className="basis-full flex justify-center">
        <a
          href="https://www.startschool.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl px-6 py-3 text-sm font-semibold text-slate-950 bg-[#ff78c8] hover:opacity-90"
        >
          StartSchool™
        </a>
      </div>
    </div>
  )
}
