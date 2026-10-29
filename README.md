# GMAT progress dashboard

Published site: https://ninakatif-netizen.github.io/gmat/

## Updating study progress

For routine ChatGPT/Codex revisions, edit [`dist/progress.json`](dist/progress.json). It contains the target score, conservative readiness estimates, recommendations, study history, and recent evidence used by the dashboard.

The complete GMAT roadmap lives in [`dist/syllabus.json`](dist/syllabus.json). Each syllabus item has an independent status and priority tier. Preserve the full syllabus, update a status only when the study evidence supports it, and never invent accuracy or question-attempt values.

Keep `dist/index.html` unchanged unless the user explicitly requests a design or behavior change. Do not reintroduce missions or review checkboxes, and do not store mastery/progress data only in the browser.

The optional active-study timer and its Today / Week / All-Time distributions are implemented separately in [`dist/timer.js`](dist/timer.js). It stores only timer state and completed timer sessions in the browser under `gmat655-study-timer-v1`; it must never modify mastery, readiness, syllabus coverage, or mountain progress.

After updating the JSON:

1. Confirm it is valid JSON.
2. Check that percentages remain between 0 and 100.
3. Commit and push to `main`.
4. GitHub Pages deploys automatically.
