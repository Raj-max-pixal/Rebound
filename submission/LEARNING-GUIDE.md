# Understand your project before judging
The judging criteria reward learning. AI is allowed, but the student must be able to explain the final project.

## Trace one plan by hand
Open the sample. There are 220 total minutes and 45 minutes today. Biology needs 60 minutes today: 25 + 20 fit, 15 do not. Math needs 70 minutes by tomorrow: tomorrow has 60, leaving another 10 unallocated. English and History fit later. Total planned = 195; visible unallocated = 25; 195 + 25 = 220.

Change today to 60. Biology now fits; Math still has 10 minutes of shortfall tomorrow. Change other days to 90 and all work fits. Explain why that happens without looking at the code.

## Read these three functions
1. `makePlan` in dist/planner.mjs: filters completed tasks, sorts due dates, loops through days, allocates minutes, records risks.
2. `validateState` in the same file: rejects malformed backups before replacing the student's state.
3. The `sessions` click handler in dist/app.mjs: increments completed minutes, consumes today's remaining time, then saves and rerenders.

## Questions to practice
- Is this AI? The development used AI; the app itself uses an explainable scheduling algorithm.
- Why 25-minute sessions? A configurable future option could be better; 25 is currently an upper limit for manageable chunks, not a clinically proven choice for all students.
- What if the task takes longer? Edit its total estimate. Completed time is preserved.
- Does it prevent impossible deadlines? No. It shows them so the student can decide what to change or ask a teacher.
- How do you know it helps? We have verified software behavior. We need actual student feedback before claiming educational benefit.
- Where is the data? In localStorage on this browser profile. Export creates a JSON backup. There is no server database or account sync.
- Why not add a chatbot? This prototype's main value is capacity-aware planning. A chatbot would add cost and uncertainty without being necessary for that function.
- What's the limitation of the algorithm? Greedy earliest-deadline ordering, no prerequisites or automatic estimation, seven-day horizon, same default budget on future days.

## Make one real contribution
Try a scenario from your own school life using non-sensitive task descriptions. Identify a confusing part of the workflow. Explain the desired improvement and review the change with Codex. Record your actual decisions in the submission. Do not pretend to have written generated code unaided.
