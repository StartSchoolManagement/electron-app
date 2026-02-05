-- ===============================================================
-- SECURE LEADERBOARD - Remove public INSERT, add score bounds
-- ===============================================================
-- Run this in your Supabase SQL Editor AFTER deploying the new
-- API route (/api/submit-score). The app will stop working if
-- you run this before deploying because the client can no longer
-- insert directly.
-- ===============================================================

-- 1. Drop the old public insert policy (the vulnerability)
drop policy if exists "Allow public insert" on public.leaderboard;
drop policy if exists "Allow public insert access" on public.leaderboard;

-- 2. Add a CHECK constraint so even the service role can't insert bad data
alter table public.leaderboard
  add constraint score_bounds check (score >= 1 and score <= 3000);

-- 3. (Optional) Clean up any fraudulent scores already in the table
-- Uncomment and run if you want to remove scores outside valid bounds:
-- delete from public.leaderboard where score > 3000 or score < 1;

-- ===============================================================
-- RESULT:
--   SELECT  → public (anyone can read)     ✅ kept
--   INSERT  → blocked for anon/public      🔒 removed
--   UPDATE  → blocked (no policy)          🔒 unchanged
--   DELETE  → blocked (no policy)          🔒 unchanged
--   Service role (server API) can still insert, bypassing RLS.
-- ===============================================================
