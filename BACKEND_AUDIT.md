# Backend audit and stabilization roadmap

Date: 2026-08-04

This document records the initial backend audit. It is intentionally based on the
current implementation and favors incremental changes over a full rewrite.

## Executive summary

The existing Spring Boot backend is a viable foundation. The main architectural
risk is that business state is split between PostgreSQL and mutable in-memory
objects. The database should become the single source of truth; any cache should
be disposable and reconstructable.

Before that refactor, authorization and regression tests require immediate
attention. Several endpoints trust a `userId` supplied by the client, and some
administrative operations are exposed to any authenticated user.

## Priority 0: security and data integrity

1. **Remove the hard-coded JWT signing key.**
   `JwtService` contains a repository-visible signing key and creates tokens with
   a lifetime of roughly nine months. Move the secret and lifetime to validated
   environment configuration, rotate the production key, and use shorter-lived
   access tokens.

2. **Derive user identity from the authenticated principal.**
   Team, chip, watchlist, transfer and pass-turn operations currently accept a
   client-controlled user ID. A normal user must only mutate their own resources;
   explicit acting-on-behalf-of behavior belongs in separately authorized admin
   endpoints.

3. **Restrict transfer-window administration.**
   The regular market controller exposes an endpoint that opens a transfer
   window. Opening, closing and scheduling windows must require an admin role.

4. **Remove production-capable default accounts/passwords.**
   Startup seeding contains hard-coded credentials and is invoked on every
   application startup. Demo/dev data must be guarded by a non-production
   profile and production must fail closed when required configuration is absent.

5. **Add database constraints for business invariants.**
   Important invariants such as unique ownership and one game-data record per
   user are not consistently enforced by the database. Application checks alone
   are insufficient under concurrent requests.

## Priority 1: regression safety

There are currently no backend test sources. Add tests before changing the state
model:

- unit tests for squad formation, substitutions, captain/chip and IR rules;
- unit tests for scoring and transfer-turn rules;
- service integration tests for transfers and gameweek rollover;
- authorization tests proving that users cannot mutate another user's data;
- idempotency tests for scheduled jobs and repeated external API payloads.

The Gradle test task currently completes, but it executes no project tests.

## Priority 1: single source of truth

### Current risks

- `PlayerRegistry` holds mutable `ArrayList` and `HashMap` collections in a
  singleton Spring service.
- domain `Player` objects are mutated alongside JPA entities.
- `TransferMarketService` stores the active window, current gameweek and turn
  queue only in process memory.
- a restart loses the live turn state, and a second server instance would have a
  different state.
- database rollback cannot roll back mutations already made to in-memory domain
  objects.

### Target

- PostgreSQL stores all durable and coordination state.
- service methods load the required aggregate inside a transaction, validate the
  command, persist it, commit, and only then publish an event.
- player read models may be cached only when they are immutable or safely
  invalidated; correctness may never depend on the cache.
- transfer-window status and the next turn are persisted and protected by a row
  lock or optimistic version.
- scheduled operations are idempotent and use database-backed coordination so a
  duplicate execution is harmless.

## Priority 2: persistence and transaction reliability

- Introduce Flyway migrations and stop relying on `ddl-auto=update` in local
  development as the schema history mechanism.
- Add `@Version` or explicit locking to concurrently modified aggregates.
- avoid sending WebSocket messages before the surrounding transaction commits;
  publish after-commit domain events instead.
- do not swallow exceptions inside transactional services. In particular, live
  score updates currently log broad exceptions inside the transaction, which can
  allow partial or misleading completion semantics.
- define explicit timeouts and retry/backoff rules for calls to the FPL API.
- move nonessential external network calls out of the critical startup path.

## Priority 2: API quality and operations

- Add request validation with Jakarta Bean Validation.
- Add a global exception handler with a stable error response shape.
- separate public, user and admin routes consistently.
- authenticate WebSocket/STOMP activity or make topics strictly read-only and
  non-sensitive.
- add structured operational logs, metrics for scheduler outcomes, and health
  checks that distinguish liveness from readiness.
- review Hikari lifetimes and production database limits against the selected
  hosting provider.

## Recommended implementation phases

1. **Safety baseline:** tests for the most critical domain rules, security fixes,
   configuration cleanup and stable error responses.
2. **Persist transfer state:** make the draft/transfer window restart-safe and
   concurrency-safe.
3. **Remove mutable player authority:** make repositories the write path and turn
   `PlayerRegistry` into a read-only/disposable projection or remove it.
4. **Harden schedulers and synchronization:** idempotency, locking, retries,
   transaction-bound events and integration tests.
5. **Migrations and operations:** Flyway, observability, backup/restore rehearsal
   and production configuration validation.
6. **Frontend modernization:** only after the backend contracts and behavior are
   stable; Next.js should be evaluated as an option, not assumed as a rewrite.

## Initial effort estimate

These are active engineering hours, not elapsed calendar time:

| Scope | Estimate |
| --- | ---: |
| Audit completion and executable test baseline | 6-12 hours |
| Security and API ownership fixes | 6-12 hours |
| Persisted transfer/draft state | 10-20 hours |
| Player state/source-of-truth refactor | 15-30 hours |
| Scheduler, transaction and FPL integration hardening | 12-24 hours |
| Flyway, constraints, observability and deployment hardening | 10-20 hours |
| Backend subtotal | **59-118 hours** |
| Frontend cleanup, accessibility and performance | 25-50 hours |
| Full stabilization subtotal | **84-168 hours** |

Bug fixes and new features that are not yet specified are outside this range.
A useful, materially safer first release does not require completing the entire
roadmap and should be achievable after roughly 20-35 focused hours.

## Hosting direction

The workload currently favors one small long-running Spring service plus managed
PostgreSQL rather than a full serverless rewrite because it uses scheduled work,
live updates and coordinated transfer turns. Hosting options should be evaluated
after measuring memory, database size, active users and acceptable cold-start
behavior. A free deployment may be possible, but it will likely trade away
always-on availability, database capacity, or operational simplicity.
