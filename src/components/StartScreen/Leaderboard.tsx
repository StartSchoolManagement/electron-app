// src/components/LeaderBoard.tsx

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useGameStore } from '@/store/useGameStore'

interface Entry {
  name: string
  score: number
}

export default function LeaderBoard() {
  const [rows, setRows] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const screen = useGameStore((s) => s.screen)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('leaderboard')
      .select('name, score')
      .order('score', { ascending: false })
      .limit(10)

    if (data) setRows(data)
    setLoading(false)
  }

  useEffect(() => {
    // immediate load when component mounts or when returning to Start screen
    load()

    // poll every 60s while on the Start screen
    if (screen === 'game') return
    const id = window.setInterval(() => {
      load()
    }, 60_000)

    return () => clearInterval(id)
  }, [screen])

  return (
    <div className="rounded-xl border border-cyan-400/20 bg-slate-900 p-4">
      <h3 className="mb-3 text-xs uppercase tracking-widest text-cyan-300">
        Leaderboard
      </h3>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <svg className="h-4 w-4 animate-spin text-cyan-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading scores…</span>
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="text-xs text-slate-500">
          no scores yet
        </div>
      )}

      <div className="space-y-1">
        {rows.map((r, i) => (
          <div
            key={`${r.name}-${i}`}
            className="grid grid-cols-[24px_1fr_auto] items-center text-xs text-slate-300"
          >
            <span className="text-cyan-400">{i + 1}</span>
            <span className="truncate">{r.name}</span>
            <span className="font-mono text-cyan-200">
              {r.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
