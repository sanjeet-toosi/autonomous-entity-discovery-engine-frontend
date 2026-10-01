# business-graph-frontend

Real-time control center for the Autonomous Business Graph Agent. Next.js (App Router),
TypeScript, Tailwind v4, TanStack Query, WebSocket live updates.

```bash
cp .env.example .env.local      # NEXT_PUBLIC_API_URL / NEXT_PUBLIC_WS_URL → backend (default :8010)
pnpm install
pnpm dev                        # http://localhost:3000
```

## Screens

| Route | What it shows |
|---|---|
| `/` Control Center | mission input with interpretation preview, run controller (pause/resume/stop), metric cards with 1h/24h/7d/total ranges, live activity feed with category filters + raw log, currently-processing domains with stage, worker fleet, frontier |
| `/runs`, `/runs/[id]` | run list with lineage; live run dashboard with errors, checkpoints, graph changes, businesses/hour sparkline |
| `/graph` | progressive hierarchy explorer (server aggregation, filters: country / confidence / last 24h), search, business inspector drawer |
| `/businesses` | searchable, paginated node list → inspector (overview, categories, evidence, relationships, pages, history, agent activity, outbound discoveries) |
| `/categories`, `/categories/[id]` | taxonomy list and category inspector (roll-ups, top countries, subcategories, history) |
| `/brain` | vertical experts, strategies with promote/reject, lessons with validate/reject, source intelligence, failures, experiments, learned knowledge |
| `/activity` | full event stream (live + paginated history) |
| `/system` | infra health, worker heartbeats, queue depth, crawl governance, recent errors |

## Real-time model

On load each page fetches a REST snapshot, then attaches to `/ws/runs/{id}` (or `/ws/global`).
`METRICS_UPDATED` and `STAGE_CHANGED` events update state without persisting; other events are
prepended to the feed and invalidate queries (throttled). On reconnect the snapshot is reloaded.
