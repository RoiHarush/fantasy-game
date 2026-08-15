# Logging and log export

## What is recorded

The backend emits application and operational logs with a timestamp, severity,
service name, logger and request correlation id. Critical workflows already log
their identifiers and outcomes, including lifecycle scheduling, gameweek
rollover/finalization, scoring, transfer windows, draft/waiver execution, IR,
notifications, FPL synchronization and season reset.

Every `/api/` request also records its method, path, response status and elapsed
time. Bodies, query strings, cookies and authorization values are deliberately
excluded so passwords and verification/reset tokens cannot enter production
logs.

## Local development

The `dev` profile writes to both the console and:

```text
backend/logs/fantasy-backend.log
```

Files roll at 10 MB, are retained for 14 days and have a total 200 MB cap. The
directory is ignored by Git.

## Render production

The `prod` profile writes only to stdout/stderr. Render captures these streams.
Do not configure a production file inside the Docker container: Render's
filesystem is ephemeral and the file can disappear during a deploy or restart.

Render Hobby currently retains dashboard logs for seven days. Export incidents
or rehearsal windows before they age out.

Install and authenticate the Render CLI, then run from the repository root:

```powershell
render login
./scripts/export-render-logs.ps1 `
  -ResourceId 'srv-xxxxxxxx' `
  -Start '2026-08-21T18:00:00+03:00' `
  -End '2026-08-21T23:59:59+03:00'
```

The generated JSON is stored under `exports/`, which is ignored by Git. It can
be searched, archived or attached to a debugging task without copying logs out
of the Render dashboard by hand.

To retain logs beyond Render's plan retention without manual exports, configure
a workspace log stream to a supported external logging provider. This is an
optional operational upgrade and does not require application code changes.

## Incident workflow

1. Record the user-visible time, league, gameweek and affected user.
2. Export the surrounding Render time range immediately.
3. Search by `requestId`, league id, gameweek id, user id or notification event
   id to reconstruct the flow.
4. Never publish an export publicly. Logs can contain internal numeric IDs and
   stack traces even though secrets and request bodies are excluded.
