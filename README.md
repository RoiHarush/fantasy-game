# Premier League Fantasy Draft

A real-time fantasy draft game with custom league scoring, exclusive player ownership, live transfer windows, captains, unrestricted IR slots, and offline waiver priorities.

The application is a Java 21 / Spring Boot 3.3 API backed by PostgreSQL, with a React 19 / Vite client. It is intentionally a client-server application: the server owns league state, authorization, scheduled gameweek transitions, scoring, and concurrent draft/transfer decisions.

## Current capabilities

- Self-service registration and JWT authentication.
- Create a league or join one with an invitation code.
- League-scoped data and configurable scoring rules.
- Separate permissions for league administrators and the global super administrator.
- Snake draft and database-backed transfer windows.
- Up to two successful offline waiver swaps, evaluated in priority order.
- Captain, first-pick captain, and unrestricted IR management.
- Per-league scoring from raw Premier League match statistics.
- WebSocket updates with authenticated, league-isolated subscriptions.
- Versioned production migrations with Flyway.

## Permission model

| Actor | Scope |
| --- | --- |
| User without a league | Scout players, create a league, or join by code |
| League member | Normal fantasy screens and actions for their league |
| League administrator | League settings and league operations for their league only |
| Super administrator | Global operational and correction tools |

The legacy `ROLE_ADMIN` value grants no global privilege. Global access requires `ROLE_SUPER_ADMIN`; league administration is represented separately by league ownership/membership data.

## Repository layout

```text
backend/                 Spring Boot API, schedulers, persistence and tests
frontend/                React/Vite single-page application
backend/src/main/resources/db/migration/
                         Versioned PostgreSQL migrations
docs/OPERATIONS.md       Deployment, backup and rollback runbook
render.yaml              Render backend definition
.github/workflows/ci.yml Backend and frontend CI checks
```

## Run locally

Prerequisites: JDK 21 and Node.js 22.

The development profile uses a persistent local H2 database. Automation and live FPL bootstrap are both disabled by default, so a normal restart never advances historical state or silently inserts data.

```powershell
cd backend
.\gradlew.bat bootRun
```

To populate an empty database explicitly from the live FPL API, run once with:

```powershell
$env:BOOTSTRAP_ENABLED = "true"
.\gradlew.bat bootRun
Remove-Item Env:BOOTSTRAP_ENABLED
```

In another terminal:

```powershell
cd frontend
npm ci
npm run dev
```

The API runs at `http://localhost:8080`. No development users or leagues are seeded.

## Verify changes

```powershell
cd backend
.\gradlew.bat test --console=plain --no-daemon

cd ..\frontend
npm ci
npm run lint
npm run build
```

## Production configuration

Copy the two `.env.example` files as a reference, but configure secrets in the hosting provider rather than committing them. The important backend variables are:

- `SPRING_PROFILE=prod`
- `DATABASE_URL` in JDBC format
- `DATABASE_USER` and `DATABASE_PASSWORD`
- a random `JWT_SECRET` containing at least 32 bytes
- `WEBSOCKET_ALLOWED_ORIGIN_PATTERNS`, containing every production frontend origin allowed to open a SockJS/STOMP connection
- `SCHEDULING_ENABLED`, kept `false` until post-deploy state checks pass
- `BOOTSTRAP_ENABLED`, normally `false`; set to `true` only for an explicit initial/season load

## New-season reset

A season reset deletes every application row, including users and leagues, while preserving the Flyway schema. It is deliberately available only during startup and refuses to run while scheduling is enabled or without the exact confirmation value.

```powershell
$env:SCHEDULING_ENABLED = "false"
$env:SEASON_RESET_ENABLED = "true"
$env:SEASON_RESET_CONFIRMATION = "RESET_ALL_SEASON_DATA"
$env:BOOTSTRAP_ENABLED = "true"
.\gradlew.bat bootRun
```

After the reset and FPL bootstrap complete, remove `SEASON_RESET_ENABLED` and `SEASON_RESET_CONFIRMATION` before the next restart. Leaving the reset flags configured would intentionally wipe the database again.

The production rollout and database recovery process is documented in [docs/OPERATIONS.md](docs/OPERATIONS.md).

## Hosting notes

The frontend can remain a Vercel static deployment. The backend currently needs a continuously running process because it owns WebSocket sessions and scheduled gameweek work. Render's free web service sleeps after inactivity, so it is suitable for a demo but not a reliable season backend without redesigning scheduled execution. A free Neon database is a practical low-cost option while its storage and compute quotas remain sufficient.

Browser REST calls stay same-origin and are forwarded to the backend by the Next.js `/api` rewrite; the backend intentionally does not maintain a second REST CORS allowlist. Before every production launch, test the authenticated `/ws` path from at least two real devices: verify connection, a live cross-device update, automatic reconnection after temporarily disabling one device's network, and state recovery after refreshing the page.

## Data and trademarks

This is a personal, non-commercial project and is not affiliated with or endorsed by the Premier League. Names, logos, trademarks, and third-party football data remain the property of their respective owners. Review the applicable data source terms before operating the application publicly.
