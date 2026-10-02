# Rebound credit integration plan

This plan assigns each available sponsor credit to a specific product purpose. Credentials belong in the provider dashboard or production secrets, never in Git, browser JavaScript, screenshots, or a hackathon submission.

## Featherless.ai: optional comeback coach

Add a server-only `POST /api/coach` endpoint after a **newly rotated** Featherless key is stored as `FEATHERLESS_API_KEY`. The coach receives only an opt-in summary selected by the student, such as unfinished task titles, estimates, and available minutes. It returns a short encouragement and a single next step. Rate-limit the endpoint per device and cap output tokens to control free-credit use.

## n8n: weekly reflection automation

Use an n8n webhook after opt-in to send a weekly reflection prompt containing only aggregated focus minutes and completed-session counts. Keep the webhook URL as a server secret. The first workflow can write the reflection to a student-approved destination or email only after explicit user setup.

## Render: independent backend option

The current public demo uses Sites Worker plus D1. If a separate API is needed for the Featherless coach or n8n webhook relay, deploy the existing Node-compatible API layer to Render with environment variables for secrets. Do not run two writable production databases at once; choose D1 or Render Postgres as the source of truth first.

## Gen.xyz: judge-friendly domain

After a Gen.xyz domain is claimed in the owner’s account, add it in the hosting provider’s custom-domain panel and copy the generated DNS records exactly. Verify HTTPS before sharing it with judges. The current demo URL remains usable until DNS finishes.

## Momen and Backboard

Use Momen for a rapid non-code prototype or judge-facing intake flow only if it does not duplicate the working Rebound frontend. Use Backboard only if an AI-agent experience is deliberately chosen instead of the lightweight Featherless coach. Neither is required for the current browser-first app.

## Safety and privacy gates

- Rotate any token that has appeared in a chat or document before use.
- Collect a clear opt-in before sending school data to an AI service or automation.
- Do not collect names, school names, messages, camera, microphone, or precise location for FocusTown.
- Test usage caps with a non-production key before enabling a public demo.
