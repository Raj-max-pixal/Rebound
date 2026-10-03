# Vercel deployment

Vercel serves the Rebound frontend from `dist`. Its `/api/*` requests proxy to the existing Rebound backend, so focus history and study rooms remain available during the migration.

1. In Vercel, import `Raj-max-pixal/Rebound` from GitHub.
2. Set the build command to `node build.mjs` and the output directory to `dist`.
3. Deploy. Then add the Vercel production URL to Supabase Authentication > URL Configuration as both the Site URL and an allowed redirect URL.

The first profile version stores its private fields in the authenticated user's Supabase account metadata, so it works without a migration. The SQL migrations remain ready for a future shared profile table and use row-level security.
