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

The development profile uses a persistent local H2 database. Automation is disabled locally by default so opening an old database cannot advance historical gameweeks.

```powershell
cd backend
.\gradlew.bat bootRun
```

In another terminal:

```powershell
cd frontend
npm ci
npm run dev
```

The client runs at `http://localhost:5173`; the API runs at `http://localhost:8080`. Development seed users are created only in the development profile.

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
- `CORS_ALLOWED_ORIGINS` and `WEBSOCKET_ALLOWED_ORIGIN_PATTERNS`
- `SCHEDULING_ENABLED`, kept `false` until post-deploy state checks pass

The production rollout and database recovery process is documented in [docs/OPERATIONS.md](docs/OPERATIONS.md).

## Hosting notes

The frontend can remain a Vercel static deployment. The backend currently needs a continuously running process because it owns WebSocket sessions and scheduled gameweek work. Render's free web service sleeps after inactivity, so it is suitable for a demo but not a reliable season backend without redesigning scheduled execution. A free Neon database is a practical low-cost option while its storage and compute quotas remain sufficient.

## Data and trademarks

This is a personal, non-commercial project and is not affiliated with or endorsed by the Premier League. Names, logos, trademarks, and third-party football data remain the property of their respective owners. Review the applicable data source terms before operating the application publicly.
