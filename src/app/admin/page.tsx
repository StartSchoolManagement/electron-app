// src/app/admin/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface AdminEntry {
  id: number
  email: string | null
  score: number
  created_at: string
}

type SortOrder = 'asc' | 'desc'

export default function AdminPage() {
  const router = useRouter()
  const [rows, setRows] = useState<AdminEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [authChecking, setAuthChecking] = useState(true)
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  async function loadData(order: SortOrder) {
    setLoading(true)
    const { data, error } = await supabase
      .from('leaderboard')
      .select('id, email, score, created_at')
      .order('score', { ascending: order === 'asc' })

    if (error) {
      // Error loading admin data from Supabase
    }
    if (data) setRows(data)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  // Check authentication on mount
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/admin/login')
        return
      }

      // Verify user is an admin
      const { data: adminData } = await supabase
        .from('admins')
        .select('id')
        .eq('email', session.user.email)
        .single()

      if (!adminData) {
        await supabase.auth.signOut()
        router.push('/admin/login')
        return
      }

      setAuthChecking(false)
      // Load data after auth check passes
      loadData(sortOrder)
    }

    checkAuth()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  // Load data when sort order changes (only after auth is done)
  useEffect(() => {
    if (!authChecking) {
      loadData(sortOrder)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOrder])

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleString()
  }

  // Show loading while checking auth
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500">
          <svg className="h-5 w-5 animate-spin text-cyan-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Checking authentication...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold uppercase tracking-widest text-cyan-300">
            Admin Panel
          </h1>
          <button
            onClick={handleLogout}
            className="rounded-md bg-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 hover:bg-slate-700"
          >
            Logout
          </button>
        </div>

        {/* Sort Controls */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setSortOrder('desc')}
            className={`rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
              sortOrder === 'desc'
                ? 'bg-cyan-400 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Points High → Low
          </button>
          <button
            onClick={() => setSortOrder('asc')}
            className={`rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
              sortOrder === 'asc'
                ? 'bg-cyan-400 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Points Low → High
          </button>
        </div>

        {/* Data Table */}
        <div className="rounded-xl border border-cyan-400/20 bg-slate-900 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-8 text-slate-500">
              <svg className="h-5 w-5 animate-spin text-cyan-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Loading...</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cyan-400/20 bg-slate-800/50">
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-cyan-300">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-cyan-300">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-cyan-300">
                    Points
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-cyan-300">
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No entries found
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-800 hover:bg-slate-800/30"
                    >
                      <td className="px-4 py-3 text-slate-400">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {row.email || <span className="text-slate-600 italic">no email</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-cyan-200">
                        {row.score}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {formatDate(row.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Stats */}
        {!loading && rows.length > 0 && (
          <div className="mt-4 text-xs text-slate-500">
            Total entries: {rows.length}
          </div>
        )}
      </div>
    </div>
  )
}
