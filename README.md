# GMAT progress dashboard

Published site: https://ninakatif-netizen.github.io/gmat/

The home page focuses on today's agreed checklist, the active-study timer, and a small summary of plan completion. The full calendar is in `dist/plan.html`; syllabus, error log, formulas, and study history are available in `dist/library.html`.

The daily schedule is shared through `dist/plan-data.js`. Preserve its dates, task IDs, question counts, and planned durations unless the user revises the plan. `dist/plan.js` uses the existing `gmat-plan` browser storage key on both pages, so moving between Today and Full plan keeps the same checkmarks. Checklist completion counts are not mastery estimates.

## Updating study progress

For routine ChatGPT/Codex revisions, edit [`dist/progress.json`](dist/progress.json). It contains the target score, conservative readiness estimates, recommendations, study history, and recent evidence used by the dashboard.

The complete GMAT roadmap lives in [`dist/syllabus.json`](dist/syllabus.json). Each syllabus item has an independent status and priority tier. Preserve the full syllabus, update a status only when the study evidence supports it, and never invent accuracy or question-attempt values.

Keep the home page focused on the daily plan, timer, and small progress summary. Do not reintroduce a competing daily checklist, XP, readiness widgets, or duplicated time charts. Do not store mastery/progress data only in the browser.

The active-study timer is implemented in [`dist/timer.js`](dist/timer.js). It stores timer state and completed timer sessions in the browser under `gmat655-study-timer-v1`; it must never modify mastery, readiness, syllabus coverage, or mountain progress.

The legacy Daily Boost script (`dist/habit.js`) is no longer loaded. Its historical browser storage is preserved.

The library's Official Guide retry tracker lives in [`dist/retry.js`](dist/retry.js). It derives missed questions from `practiceSessions`, saves retry outcomes locally under `gmat655-og-retry-v1`, and does not change the original question scores or readiness.

After updating the JSON:

1. Confirm it is valid JSON.
2. Check that percentages remain between 0 and 100.
3. Commit and push to `main`.
4. GitHub Pages deploys automatically.
