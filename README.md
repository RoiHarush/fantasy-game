# Premier League Fantasy Draft

A real-time fantasy draft game with custom league scoring, exclusive player ownership, live transfer windows, captains, unrestricted IR slots, and planned waiver priorities.

The application is a Java 21 / Spring Boot 3.3 API backed by PostgreSQL, with a Next.js 16 / React 19 client. It is intentionally a client-server application: the server owns league state, authorization, scheduled gameweek transitions, scoring, and concurrent draft/transfer decisions.

## Current capabilities

- Email-verified registration, email-or-username sign-in, secure password reset, and JWT session cookies.
- Create a league or join one with an invitation code.
- League-scoped data and configurable scoring rules.
- Separate permissions for league administrators and the global super administrator.
- Snake draft and database-backed transfer windows.
- Explicit opt-out waiver automation: users who mark that they will not attend are processed from their saved priority list, while every other user keeps manual control regardless of connection state.
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
frontend/                Next.js application
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
- `APP_PUBLIC_URL`, the public Next.js origin used in verification/reset links
- `MAIL_PROVIDER=resend`, `RESEND_API_KEY`, and `MAIL_FROM` using a sender on a verified domain
- one stable VAPID key pair in `WEB_PUSH_VAPID_PUBLIC_KEY` and `WEB_PUSH_VAPID_PRIVATE_KEY`
- `WEB_PUSH_VAPID_SUBJECT`, normally a `mailto:` address for the operator

The optional AI surfaces run entirely in the backend. For Gemini configure these only in Render:

- `AI_ENABLED=true`
- `AI_PROVIDER=gemini`
- `AI_API_KEY`, created in Google AI Studio
- `AI_MODEL=gemini-3.5-flash`
- `AI_ROAST_PROMPT_FILE=/etc/secrets/ai-roast-prompt.txt`, pointing to a Render Secret File named `ai-roast-prompt.txt`; a missing or empty file safely uses the built-in prompt
- `AI_ROAST_ENABLED=true` when the public roast feed is ready; the private super-admin preview works independently
- `AI_COACH_ENABLED`, kept `false` until Alex is ready for users

No Gemini secret belongs in Vercel or in a `NEXT_PUBLIC_*` variable. Switching back to Groq requires only
`AI_PROVIDER=groq`, the Groq key, and a compatible `AI_MODEL`; no code or database change is needed.

Local development defaults to `MAIL_PROVIDER=log`; verification and password-reset links are printed in the backend log. Production uses Resend's HTTP API. The free Resend plan is ample for this league, but delivery to real users requires verifying a domain in Resend first.

Generate the Web Push keys once (do not generate them again on every deploy):

```powershell
npx web-push generate-vapid-keys
```

Put both values in the Render backend environment and keep the private key secret. Browsers create subscriptions against the public key, so replacing the pair invalidates existing device subscriptions. Push requires HTTPS in production. On iPhone, the user must install the PWA on the Home Screen and enable notifications from inside that installed app; Android and desktop browsers can enable them directly from Settings.

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

The frontend runs as a Next.js deployment on Vercel. The backend needs a continuously running process because it owns WebSocket sessions and scheduled gameweek work. Render's free web service sleeps after inactivity, so it is suitable for the initial rehearsal but not for the live season. The launch database is a fresh Render PostgreSQL instance that can begin on the free plan for rehearsal, then be reset and upgraded before real users register.

Browser REST calls stay same-origin and are forwarded to the backend by the Next.js `/api` rewrite; the backend intentionally does not maintain a second REST CORS allowlist. Before every production launch, test the authenticated `/ws` path from at least two real devices: verify connection, a live cross-device update, automatic reconnection after temporarily disabling one device's network, and state recovery after refreshing the page.

## Data and trademarks

This is a personal, non-commercial project and is not affiliated with or endorsed by the Premier League. Names, logos, trademarks, and third-party football data remain the property of their respective owners. Review the applicable data source terms before operating the application publicly.
