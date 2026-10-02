# Rebound
A zero-API-cost, device-local catch-up planner for students returning after missed classes.

## Run
Requires Node.js (used only for local serving and tests). No installation or API keys.

    node serve.mjs

Open http://127.0.0.1:4173. Run scheduling tests with `node --test tests/planner.test.mjs`.
The app consists of plain HTML, CSS, and JavaScript modules in `dist/`. Any static HTTP server can serve that directory. Opening index.html directly with file:// is not supported because of browser module restrictions.

## What works
- A labeled, fictional sample week with a real scheduling engine.
- Add, edit, and remove assignments; set a deadline, time estimate, and priority.
- Seven-day planning, daily limits, and sessions of at most 25 minutes.
- Separate warnings for missed deadlines, work that cannot fit, and work beyond the seven-day window.
- Complete today's sessions; reduce today's remaining capacity so the plan does not refill time already spent. Undo the last mutation for nine seconds.
- Editable teacher-request draft; nothing is sent automatically.
- Browser-local persistence, validated JSON backup/restore, print all seven days.
- Responsive interface, keyboard tabs, labeled forms, native modal dialogs, escaped task text.

## How the scheduler works
`dist/planner.mjs` sorts unfinished tasks by ascending due date, then high priority for tied dates, then stable ID. It fills available time from today onward through the deadline, cutting sessions at 25 minutes. It never schedules above a day's capacity. An overdue assignment may use today's time but remains flagged. Unallocated work stays visible instead of being silently discarded. The planner does not optimize all possible orderings or understand topic prerequisites.

`dist/app.mjs` connects inputs and completion actions to this pure scheduler. Completing a session increments task progress and decreases today's remaining budget. New dates reset today's budget to the default. All state lives in localStorage under `rebound-plan-v1`; no assignment data is sent to a backend.

## Costs and privacy
Runtime API cost: $0. No paid APIs, subscriptions, advertising, trackers, remote fonts, database, or third-party runtime dependencies. Existing ChatGPT/Codex access was used for development; this is not a claim that development AI is universally free. Hosting is through the user's available Sites capability, subject to its availability and terms. The source remains portable to another static host.

Browser storage is device-local, not encrypted storage or multi-device sync. Do not enter sensitive personal records. Clearing site data removes the plan. The hosting provider receives normal web requests. Network access is needed to load the site; offline reload/install support is not implemented. Once loaded, planning uses local JavaScript.

## Validation
10 Node test cases pass, including 100 deterministic generated workload scenarios checking minute conservation, deadline constraints, session length, and capacity. Browser checks cover completion and undo, a rest day, draft generation, create/edit/delete, literal rendering of HTML-like user input, reload persistence, backup download, replacement confirmation, 390px layout, and enlarged base text. Screenshots are in `submission/`.

The browser check script uses a local installed Playwright and Edge path. For another computer, adapt those two paths or install Playwright yourself; it is not a runtime dependency. Native WebMCP was unavailable in the browser used for verification; its optional, feature-detected read-only tool has not been validated in a supported native context. Browser functionality does not depend on it.

## Scope limitations
No LMS import, automatic homework extraction, AI tutoring, notifications, account sync, or automatic messages. Daily default is uniform across the next six days; today can be adjusted separately. It schedules study minutes, not wall-clock calendar events or breaks. Estimates are supplied by the student. Multi-tab concurrent edits are not synchronized; the app warns to reload. Impact has not yet been tested with real students.

## AI disclosure
See `submission/DEVPOST-DRAFT.md`. AI assistance produced the initial concept proposal, code, design, tests, documentation, and demo script. The submitting student must review these, understand the final project, and truthfully describe their own contributions and learning.
