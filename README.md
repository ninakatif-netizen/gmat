# GMAT progress dashboard

Published site: https://ninakatif-netizen.github.io/gmat/

## Updating study progress

For routine ChatGPT/Codex revisions, edit only [`dist/progress.json`](dist/progress.json). It contains the target score, percentages, topic mastery, recommendations, study history, and recent evidence used by the dashboard.

Keep `dist/index.html` unchanged unless the user explicitly requests a design or behavior change. Do not reintroduce missions, a timer, review checkboxes, or browser-only progress storage.

After updating the JSON:

1. Confirm it is valid JSON.
2. Check that percentages remain between 0 and 100.
3. Commit and push to `main`.
4. GitHub Pages deploys automatically.
