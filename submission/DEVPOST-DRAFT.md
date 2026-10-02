# Devpost submission draft — Rebound
Status: working prototype; NOT submitted. Replace bracketed entries before submitting.

## Project name
Rebound

## Tagline
Missed classes. Manageable steps. A realistic way back.

## Problem
After missing classes, a student may return to several subjects' assignments at once. A list records the backlog but does not show whether it can fit into the student's available time. Rebound explores a practical question: what can I realistically finish, and where should I ask for help?

This is our problem hypothesis. We have not yet measured its prevalence or validated impact with students. [Add a genuine personal example if available. Do not invent one.]

## What it does
Students enter assignments, due dates, and estimated study minutes, then set the time they have. Rebound builds a seven-day plan in sessions of at most 25 minutes. If work cannot fit before a deadline, it displays the shortfall and offers an editable teacher-request draft. Completing a session reduces both remaining work and today's remaining study time.

Rebound runs without paid AI APIs, keeps assignments in the browser, and supports backup/restore and printing. The sample is explicitly fictional. Teacher messages are never sent automatically.

## How it was built
HTML, CSS, JavaScript ES modules, browser localStorage, and a deterministic scheduling algorithm. Node.js serves the local preview and runs built-in tests. Playwright with Microsoft Edge was used for browser verification. Sites was used to prepare hosting. No external datasets, images, APIs, or third-party runtime libraries were used. UI visuals are typography, CSS, and a simple favicon.

## Challenges
A planner can look helpful while silently overbooking a student. We separated feasible study sessions from unscheduled work. Completion also has to consume today's available time; otherwise every completed session would refill the day with new work. Past deadlines stay flagged even when the assignment is scheduled today.

## Validation
Ten automated scheduling test cases pass, including 100 generated workload scenarios. Browser checks cover the core assignment and planning interactions, persistence, backup download, mobile layout, and escaping user-entered text. These are software checks, not proof of educational impact. [Add actual user-test results here only after conducting them.]

## Learning — student must complete honestly
[Explain in your own words how sorting and time allocation work.]
[Name one bug or design decision you personally investigated.]
[Describe what you changed or learned after reviewing the generated code.]

## AI-use disclosure
We used OpenAI Codex to propose the initial idea, generate the initial implementation and visual design, write and run automated tests, and draft documentation and submission materials. The running app does not call an AI model. [Describe exactly which parts the team reviewed, changed, tested, and understood. Do not claim manual authorship of AI-generated code.]

## Next steps
Test with students who have experienced a backlog; improve estimates based on feedback; explore day-specific availability and topic prerequisites. These are future ideas, not implemented features.

## Required links and people
- Public demo: [insert a verified public URL; owner-private preview is not enough]
- Source: [public repository if created, or attach source ZIP]
- Demo video: [insert your 1–2 minute recording]
- Team members: [enter actual names]
- Tools: HTML, CSS, JavaScript, Node.js, Playwright, Microsoft Edge, OpenAI Codex, Sites.

## Award opt-in
The entrant must personally read and accept the official Innovation Award terms and opt in on Devpost. The project must be publicly viewable after submission. Sponsor credits are separate from cash and may have additional eligibility conditions. We are not claiming the Render Workflows sponsor benefit because this project does not use Render Workflows.
