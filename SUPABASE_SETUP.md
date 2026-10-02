# Supabase account and database setup

Rebound starts in guest mode. Two seconds after a visitor opens a page, it offers an optional account. Guest data continues to use the existing Rebound storage; an account enables Supabase authentication when the runtime settings below are present.

1. Create a Supabase project and run `supabase/migrations/0001_rebound.sql` in its SQL Editor. The tables use row-level security, so each authenticated student can access only their own records.
2. In Authentication > Providers, enable Email and require email confirmation. This is the control that verifies that a student can receive mail at the address they entered.
3. To enable Google, create a Google OAuth client, put its client ID and secret in the Supabase Google provider settings, and add the live Rebound URL to Supabase's allowed redirect URLs.
4. In the Sites runtime environment, set `SUPABASE_URL` to the project URL and `SUPABASE_ANON_KEY` to the project's publishable/anon key. Do not use or expose the Supabase `service_role` key.
5. Add `https://rebound-school-comeback.astrapro70.chatgpt.site/` as a Site URL/redirect URL. Add any custom Gen.xyz URL only after it is connected, then add that exact URL too.

The browser receives only the Supabase public anon key through `/api/auth-config`. Passwords are passed directly to Supabase Auth for verification and are never stored by Rebound.
