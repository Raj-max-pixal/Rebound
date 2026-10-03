# Vercel deployment

Vercel serves the Rebound frontend from `dist`. Its `/api/*` requests proxy to the existing Rebound backend, so focus history and study rooms remain available during the migration.

1. In Vercel, import `Raj-max-pixal/Rebound` from GitHub.
2. Set the build command to `node build.mjs` and the output directory to `dist`.
3. Deploy. Then add the Vercel production URL to Supabase Authentication > URL Configuration as both the Site URL and an allowed redirect URL.

The profile editor requires the SQL migrations in `supabase/migrations/0001_rebound.sql` and `0002_profile_details.sql` to be run once in Supabase SQL Editor. The profile uses row-level security: only the authenticated user can read or edit their own row.
