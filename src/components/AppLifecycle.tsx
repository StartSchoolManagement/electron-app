'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/store/useGameStore'

export default function AppLifecycle() {
  const submitPending = useGameStore((s) => s.submitPending)

  useEffect(() => {
    // Try to submit any pending score on load
    submitPending()

    function onBeforeUnload() {
      const state = useGameStore.getState()
      const { totalScore, scoreSubmitted, screen, won, levelIndex, levelScores } = state

      if (scoreSubmitted) return

      // If we're in a game and haven't won, treat this as a quit: award 1 point for the current level
      let pending = totalScore
      if (screen === 'game' && !won) {
        pending = totalScore + 1
      }

      try {
        const name = localStorage.getItem('playerName') || ''
        const email = localStorage.getItem('playerEmail') || ''
        localStorage.setItem('pendingScore', JSON.stringify({
          name,
          email,
          score: pending,
          level_reached: levelIndex + 1,
          levels_completed: levelScores.filter((s) => s > 1).length,
          ts: Date.now(),
        }))
      } catch { /* localStorage may be unavailable */ }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [submitPending])

  return null
}