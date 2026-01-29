// src/components/StartScreen/StartScreen.tsx

'use client'

import { useState } from 'react'
import { useGameStore } from '@/store/useGameStore'
import LeaderBoard from './Leaderboard'

export default function StartScreen() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const { resetPlayer, setScreen } = useGameStore()

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const canStart = name.trim() && isValidEmail

  function start() {
    if (!canStart) return
    localStorage.setItem('playerName', name.trim())
    localStorage.setItem('playerEmail', email.trim())
    resetPlayer()
    setScreen('game')
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-950 text-cyan-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-cyan-400/30 bg-slate-900/80 p-6">
        <h1 className="mb-2 text-center text-3xl tracking-[0.3em] text-cyan-300">
          ⚡ ELECTRON
        </h1>

        <p className="mb-6 text-center text-xs uppercase tracking-widest text-slate-400">
          program the circuit
        </p>

        <input
          className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-center text-sm outline-none focus:border-cyan-400"
          placeholder="your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-center text-sm outline-none focus:border-cyan-400"
          placeholder="your email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={start}
          disabled={!canStart}
          className="mb-6 w-full rounded-xl bg-cyan-400 py-3 text-xs font-bold uppercase tracking-widest text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          start
        </button>

        <div className="mb-4 flex justify-center">
          <a
            href="https://www.startschool.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl px-6 py-3 text-sm font-semibold text-slate-950 bg-[#ff78c8] hover:opacity-90"
          >
            StartSchool™
          </a>
        </div>

        <LeaderBoard />
      </div>
    </div>
  )
}
