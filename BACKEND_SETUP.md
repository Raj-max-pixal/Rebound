# Rebound account backend

Status: Supabase project `uaiqymcbzfehcrrhvraj` is reachable and its publishable key is configured in `dist/backend-config.mjs`. Email sign-up and email confirmation are enabled; Google is disabled. The profile table was absent when checked, so the SQL migration still needs applying. `Rebound-v1.0.1.apk` has not been modified. Changes to app source require a new APK.

## One-time setup

1. Create a Supabase project in your account. Keep its database password private.
2. In SQL Editor, run `supabase/migrations/202610030001_accounts.sql` once. This is PostgreSQL SQL; do not run it against the existing SQLite/D1 database.
3. Under Authentication, enable email/password. Configure confirmation-email delivery and the Site URL for an HTTPS confirmation landing page. After confirming in a browser, users can return to the Android app and sign in. Google login is disabled in the bundled configuration until separately configured.
4. From the project connection settings, obtain the project URL and publishable (or legacy anon) key. These are public client settings. Never use a service-role key, secret key or database password in the APK.
5. Edit `dist/backend-config.mjs`: set `url`, `anonKey`, and `enabled: true`. Keep `providers.google: false` unless Google OAuth and mobile redirects are configured.
6. Run `npm run build`, `npx cap sync android`, then build a new APK. The old APK cannot automatically acquire new source code or configuration.

## What this provides

- Existing Supabase email sign-up, confirmation, login, persistent session, token refresh and sign-out.
- Account controls available inside the mobile Profile page.
- `auth.users`: account identity, registration and authentication managed by Supabase. Rebound never stores plaintext passwords.
- `rebound_profiles`: display name, optional birthday, avatar choices, creation/update time, server-recorded last login and last seen.
- `rebound_activity`: app-open, screen-view, focus button, profile-save and wardrobe-save events. Events describe app interaction, not verified study time.
- A heartbeat updates last seen once per minute while the app is visible. It does not track the user after the app closes.
- Only the signed-in user can read their records. Activity insertions go through a rate-limited function with server timestamps. Direct client writes to activity and login/seen timestamps are denied.
- Old activity is pruned after 90 days on the next activity call for that account. Inactive-account cleanup requires a scheduled database job if a strict retention deadline is needed.
- Deleting a user through Supabase Auth also deletes their linked profile/history.

## Acceptance checks after setup

1. Register two different test users. Confirm emails; sign in and sign out.
2. Edit a display name and birthday; save a wardrobe look. Check the profile row in Supabase.
3. Navigate between screens and leave the app visible for a minute. Check last_seen_at and the recent-activity list.
4. Using user B's authenticated API session, try reading/updating user A's profile or reading A's activity. No rows should be returned/changed. Run the SQL isolation test in `supabase/tests/accounts.sql` against a test project.
5. Sign out: activity recording must stop. Sign back in and refresh activity history.
6. Test offline: local features remain available, while failed cloud operations display an error. Events are not queued/replayed offline.

## Remaining limitations

Live signup, delivery of confirmation emails, database migrations and isolation tests cannot be verified without a configured project. This integration does not yet migrate device-keyed D1 focus history into Supabase or restore every local avatar/profile editor field after login. Password-reset UI, self-service account deletion, online Town chat/calls and file-storage access rules remain separate work. The existing SDK loads from a CDN, so authentication requires internet access. Do not describe this as a fully deployed backend until acceptance checks pass.

No location, private messages, screen contents, photos or raw accessibility events are uploaded by this activity integration.

Reference: https://supabase.com/docs/guides/database/postgres/row-level-security
