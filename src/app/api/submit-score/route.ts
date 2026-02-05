import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

const MAX_LEVELS = 10
const MAX_SCORE_PER_LEVEL = 300
const MAX_SCORE = MAX_LEVELS * MAX_SCORE_PER_LEVEL // 3000
const MIN_SCORE = 1

// Simple in-memory rate limiter: 1 submission per IP per 30 seconds
const rateMap = new Map<string, number>()
const RATE_LIMIT_MS = 30_000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const last = rateMap.get(ip)
  if (last && now - last < RATE_LIMIT_MS) return true
  rateMap.set(ip, now)
  // Clean old entries every 100 inserts to prevent memory leak
  if (rateMap.size > 500) {
    for (const [key, ts] of rateMap) {
      if (now - ts > RATE_LIMIT_MS) rateMap.delete(key)
    }
  }
  return false
}

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, email, score } = body as Record<string, unknown>

  // Validate name
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
  }

  // Validate email (optional but must be string if present)
  if (email !== undefined && email !== null && typeof email !== 'string') {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }
  const sanitizedEmail = typeof email === 'string' ? email.trim().slice(0, 200) : ''

  // Validate score: must be integer within game bounds
  if (typeof score !== 'number' || !Number.isInteger(score)) {
    return NextResponse.json({ error: 'Invalid score' }, { status: 400 })
  }
  if (score < MIN_SCORE || score > MAX_SCORE) {
    return NextResponse.json({ error: 'Score out of range' }, { status: 400 })
  }

  // Insert via service role (bypasses RLS)
  const { error } = await supabaseAdmin
    .from('leaderboard')
    .insert({ name: name.trim().slice(0, 100), email: sanitizedEmail, score })

  if (error) {
    console.error('Supabase insert error:', error.message)
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
