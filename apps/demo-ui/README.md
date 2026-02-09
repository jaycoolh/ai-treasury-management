# Treasury Agent Demo UI

Executive-friendly UI to visualize A2A agent activity between the UK and US treasury agents.

## Quick start

1. Start the agents (in separate terminals):
   - `pnpm dev:uk`
   - `pnpm dev:us`
2. Start the UI:
   - `pnpm --filter demo-ui dev`
3. Open `http://localhost:3000`.

## Environment variables

Set in `apps/demo-ui/.env.local` if you need custom ports:

- `NEXT_PUBLIC_UK_AGENT_URL` (default: `http://localhost:4000`)
- `NEXT_PUBLIC_US_AGENT_URL` (default: `http://localhost:5001`)

## Notes

- The UI listens to `/events` (SSE) and `/events/recent` on each agent.
- Trigger buttons POST to `/a2a/jsonrpc` to simulate AR/AP events.
