// src/components/Game/GameScreen.tsx

'use client'

import { useGameStore } from '@/store/useGameStore'
import { levels } from '@/game/levels'
import Grid from './Grid'
import ActionBar from './ActionBar'
import Controls from './Controls'
import VictoryModal from './VictoryModal'
import QuitModal from './QuitModal'

export default function GameScreen() {
  const { levelIndex, dead, won, showQuitModal } = useGameStore()
  const level = levels[levelIndex]

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 bg-slate-950">
      <h2 className="mb-4 text-xl uppercase tracking-widest text-cyan-300">
        {level.name}
      </h2>

      <div className="relative">
        <Grid />

        {dead && (
          <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center text-red-300 uppercase">
            short circuit
          </div>
        )}
      </div>

      <div className="mt-6 w-full max-w-xl">
        <ActionBar />
      </div>

      <Controls />

      {won && <VictoryModal />}
      {showQuitModal && <QuitModal />}
    </div>
  )
}
