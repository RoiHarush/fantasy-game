# Production operations runbook

This runbook is deliberately conservative. The application performs scheduled, stateful gameweek transitions, so a deployment is not complete until the database state and automation have both been verified.

## Target topology

- Frontend: Vercel static Vite deployment from `frontend/`.
- Backend: one always-on Render Docker web service from `backend/Dockerfile`.
- Database: managed PostgreSQL, preferably a separate Neon project for staging and production.
- Health check: `GET /actuator/health` must return a 2xx response.

Do not use an H2 file in production. Render service filesystems are ephemeral.

## Environment separation

Use three separate databases:

| Environment | Scheduler | Data |
| --- | --- | --- |
| Local | Off | Local H2 copy/test data |
| Staging | Off | Sanitized copy or isolated test data |
| Production | On only after verification | Live league data |

Never point a staging backend at the production database. Keep `SCHEDULING_ENABLED=false` on every new service until all checks below pass.

## Before the first production migration

1. Announce a short write freeze and make sure no draft or transfer window is active.
2. Set `SCHEDULING_ENABLED=false` on the existing backend and wait for its restart to become healthy.
3. Record the active gameweek and transfer state:

   ```sql
   SELECT id, name, status, calculated, transfer_window_processed,
          first_kickoff_time, transfer_open_time
   FROM gameweeks
   ORDER BY id;

   SELECT league_id, gameweek_id, window_type, status, phase,
          regular_cursor, ir_cursor, version
   FROM league_transfer_windows
   ORDER BY league_id, gameweek_id, window_type;
   ```

4. Create a provider recovery point if available, then take a portable `pg_dump` as described below.
5. Restore that dump into staging and run the new backend against staging first.
6. Verify registration, create/join league, league isolation, scoring settings, draft, two transfer rounds, waiver fallback, IR, and super-admin access.

## Portable backup and restore drill

Use a standard PostgreSQL connection URL for the command-line tools, not the JDBC URL used by Spring. Keep the URL in a temporary environment variable and never paste it into documentation or logs.

```powershell
$env:FANTASY_BACKUP_URL = "postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
New-Item -ItemType Directory -Force -Path .\backups | Out-Null
pg_dump --dbname=$env:FANTASY_BACKUP_URL --format=custom --no-owner --file=.\backups\fantasy-predeploy.dump
pg_restore --list .\backups\fantasy-predeploy.dump
Remove-Item Env:FANTASY_BACKUP_URL
```

Test the dump against an empty staging database:

```powershell
$env:FANTASY_STAGING_URL = "postgresql://USER:PASSWORD@STAGING_HOST/STAGING_DB?sslmode=require"
pg_restore --dbname=$env:FANTASY_STAGING_URL --no-owner --exit-on-error .\backups\fantasy-predeploy.dump
Remove-Item Env:FANTASY_STAGING_URL
```

Do not use `--clean` against production. A backup is only trusted after a restore drill succeeds and representative row counts/state queries match.

Neon also provides point-in-time restore history, but the free retention window is short. Keep the explicit dump outside the database provider for the launch window.

## Deploy backend

1. Confirm CI is green for backend tests, frontend lint, and frontend build.
2. Configure the `render.yaml` secret fields in Render. `DATABASE_URL` must be a Spring JDBC URL such as `jdbc:postgresql://HOST/DATABASE?sslmode=require`.
3. Deploy with `SCHEDULING_ENABLED=false`.
4. Wait for `/actuator/health` to report `UP`. Do not route users to an unhealthy instance.
5. Confirm Flyway applied the expected migration exactly once:

   ```sql
   SELECT installed_rank, version, description, success, installed_on
   FROM flyway_schema_history
   ORDER BY installed_rank;
   ```

6. Repeat the recorded gameweek/transfer queries and investigate any unexpected state change before continuing.
7. Run the smoke checklist below with two ordinary users, one league administrator, and the super administrator.
8. Only then set `SCHEDULING_ENABLED=true` and confirm one scheduler instance is running.

## Deploy frontend

Configure the Vercel project root as `frontend/` and set `VITE_API_URL` to the public HTTPS backend origin without a trailing slash. The checked-in `vercel.json` routes deep links such as `/status` back to the React application.

Deploy a preview first. Verify CORS and WebSocket origins before promoting it to production.

## Smoke checklist

- Health endpoint returns `UP` and logs contain no migration or database errors.
- A new user can register and sees only onboarding plus scouting.
- A user can create a league and another can join with its code.
- A member cannot read or mutate another league's data by changing URL or request IDs.
- The creator can edit only their league; a member cannot open league controls.
- Only `ROLE_SUPER_ADMIN` can open global admin pages and endpoints.
- A transfer persists after backend restart and cannot exceed two regular selections.
- An offline waiver list tries valid priorities in order and passes when none can run.
- Any owned player can enter IR, regardless of injury metadata.
- Scoring changes affect only the selected league.
- WebSocket updates reach the correct league and reconnect after a backend restart.

## Rollback

Application rollback and data recovery are separate decisions.

1. Immediately set `SCHEDULING_ENABLED=false` if state is changing incorrectly.
2. Roll Render back to the last known-good image/deploy.
3. Leave additive Flyway tables/columns in place unless the old application demonstrably cannot run with them. Never edit `flyway_schema_history` manually.
4. If live data was corrupted, stop all writers, record the incident time, and restore to a new database from the provider recovery point or the verified dump.
5. Point a staging backend at the recovered database and verify state before changing the production connection.
6. Re-enable users and automation only after the active gameweek, squads, points, transfer cursors, and waiver rows are reconciled.

## Launch schedule for August 21, 2026

- August 5-8: finish repository hardening and deploy isolated staging.
- August 9-12: restore drill plus end-to-end league rehearsal.
- August 13-16: production migration with automation off; resolve only release blockers.
- August 17: full draft/transfer/waiver rehearsal with the real league members.
- August 18: feature freeze.
- August 19-20: final backup, smoke test, monitoring and rollback readiness.
- August 21: launch; keep the operator available around the first deadline/window.

## Free-hosting constraint

Render documents that free web services spin down after 15 minutes without inbound HTTP or WebSocket traffic and can take about a minute to wake. That makes in-process scheduled deadlines unreliable when nobody is connected. Keep the backend always-on for the season. A future zero-cost design can move timers to an external scheduler and make every scheduled operation idempotent, but that is a post-launch architecture change rather than a safe deadline optimization.

References: [Render free service limits](https://render.com/docs/free), [Render health checks](https://render.com/docs/health-checks), [Vercel Vite SPA configuration](https://vercel.com/docs/frameworks/frontend/vite), [Neon pricing and restore window](https://neon.com/pricing).
