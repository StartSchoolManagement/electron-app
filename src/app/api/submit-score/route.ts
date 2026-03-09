import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

const MAX_LEVELS = 10
const MAX_SCORE_PER_LEVEL = 300
const MAX_SCORE = MAX_LEVELS * MAX_SCORE_PER_LEVEL // 3000
const MIN_SCORE = 0

// Simple in-memory rate limiter: 1 submission per IP per 30 seconds
const rateMap = new Map<string, number>()
const RATE_LIMIT_MS = 30_000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const last = rateMap.get(ip)
  if (last && now - last < RATE_LIMIT_MS) return true
  rateMap.set(ip, now)
  if (rateMap.size > 500) {
    for (const [key, ts] of rateMap) {
      if (now - ts > RATE_LIMIT_MS) rateMap.delete(key)
    }
  }
  return false
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, email, score, level_reached, levels_completed } = body as Record<string, unknown>

  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
  }

  if (email !== undefined && email !== null && typeof email !== 'string') {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }
  const sanitizedEmail = typeof email === 'string' ? email.trim().slice(0, 200) : ''

  if (typeof score !== 'number' || !Number.isInteger(score)) {
    return NextResponse.json({ error: 'Invalid score' }, { status: 400 })
  }
  if (score < MIN_SCORE || score > MAX_SCORE) {
    return NextResponse.json({ error: 'Score out of range' }, { status: 400 })
  }

  // Validate level_reached (1-10)
  const lvl = typeof level_reached === 'number' && Number.isInteger(level_reached)
    ? Math.max(1, Math.min(level_reached, MAX_LEVELS))
    : 1

  // Validate levels_completed (0-10)
  const completed = typeof levels_completed === 'number' && Number.isInteger(levels_completed)
    ? Math.max(0, Math.min(levels_completed, MAX_LEVELS))
    : 0

  const { error } = await getSupabaseAdmin()
    .from('leaderboard')
    .insert({
      name: name.trim().slice(0, 100),
      email: sanitizedEmail,
      score,
      level_reached: lvl,
      levels_completed: completed,
    })

  if (error) {
    console.error('Supabase insert error:', error.message)
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
