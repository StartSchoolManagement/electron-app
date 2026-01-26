# Supabase Setup Guide

This guide explains how to configure Supabase for the Electron game leaderboard feature.

## Prerequisites

- A [Supabase](https://supabase.com) account (free tier works fine)
- Access to your Supabase project dashboard

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Enter a project name (e.g., "electron-game")
4. Set a secure database password
5. Choose a region closest to your users
6. Click **Create new project**

## Step 2: Create the Leaderboard Table

1. In your Supabase dashboard, go to **Table Editor**
2. Click **New Table**
3. Create a table with these settings:
   - **Name**: `leaderboard`
   - **Enable Row Level Security (RLS)**: Yes

4. Add the following columns:

| Column Name | Type      | Default Value  | Primary | Nullable |
| ----------- | --------- | -------------- | ------- | -------- |
| id          | int8      | auto-generated | ✅      | ❌       |
| name        | text      | -              | ❌      | ❌       |
| score       | int4      | -              | ❌      | ❌       |
| created_at  | timestamp | now()          | ❌      | ✅       |

5. Click **Save**

### SQL Alternative

You can also run this SQL in the **SQL Editor**:

```sql
CREATE TABLE leaderboard (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read leaderboard entries
CREATE POLICY "Allow public read access"
  ON leaderboard
  FOR SELECT
  USING (true);

-- Allow anyone to insert leaderboard entries
CREATE POLICY "Allow public insert access"
  ON leaderboard
  FOR INSERT
  WITH CHECK (true);
```

## Step 3: Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Find these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key under "Project API keys"

## Step 4: Configure Environment Variables

1. Copy the example environment file:

   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Important**: Never commit `.env.local` to version control

## Step 5: Verify Setup

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Open the app and check that the Leaderboard component loads without errors

3. If you see "no scores yet", the connection is working but the table is empty

## Troubleshooting

### "Missing Supabase environment variables" Error

- Ensure `.env.local` exists in the project root
- Check that both variables are set correctly
- Restart the development server after changing env vars

### Leaderboard Not Loading

- Check the browser console for errors
- Verify your API keys in the Supabase dashboard
- Ensure the `leaderboard` table exists and has the correct schema

### RLS Policy Errors

- Make sure Row Level Security policies are configured
- Run the SQL policies from Step 2 if needed

## Production Deployment

When deploying to Vercel or Netlify:

1. Add the environment variables in your hosting provider's dashboard
2. Use the same variable names:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Vercel

1. Go to **Project Settings** → **Environment Variables**
2. Add both variables for all environments (Production, Preview, Development)

### Netlify

1. Go to **Site Settings** → **Environment Variables**
2. Add both variables

## Security Notes

- The `anon` key is safe to expose in client-side code (it's designed for this)
- Row Level Security (RLS) protects your data at the database level
- Consider adding rate limiting for production deployments
- Never expose your `service_role` key in client-side code
