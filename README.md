# Task Backlog

Password-gated task backlog with dynamic clients, High/Medium/Low priority, a star for top priority, a completed-tasks tracker, and a separate Yearly Goals panel. Data is shared across every device/browser/person via a Vercel serverless API backed by Upstash Redis — everyone hitting the same deployment sees the same board, polling for updates every ~4s.

Live at: https://backlog.helmbury.com

## Usage

Password: `backlog123`.

## Architecture

- `index.html` / `styles.css` / `app.js` — static frontend.
- `api/tasks.js` — Vercel serverless function. `GET` reads the board, `POST` overwrites it. Both require an `x-app-password` header matching `APP_PASSWORD` (falls back to `backlog123`).
- Board (`{ tasks, clients, yearlyGoals, updatedAt }`) is stored as one JSON value in Upstash Redis under the key `backlog:board`, via `@upstash/redis` reading `KV_REST_API_URL` / `KV_REST_API_TOKEN` (auto-injected by the Vercel ↔ Upstash integration).
- The frontend fetches the board on load, re-fetches every 4s to pick up changes from others, and on every mutation does read-latest → apply change → write-back (reduces, but doesn't fully eliminate, lost updates if two people edit in the same instant).

## Local development

```
npm install
vercel link      # first time only
vercel env pull .env.local --environment=production
vercel dev
```

Note: Vercel may mask values it considers sensitive as `[SENSITIVE]` when pulling to a local `.env` file — the real values are still injected correctly at deploy/runtime on Vercel itself.
