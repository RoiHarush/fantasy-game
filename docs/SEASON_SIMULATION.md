# Full-season simulation

Run from the repository root:

```powershell
.\run-season-simulation.ps1
```

To run only the backend season and domain checks:

```powershell
.\run-season-simulation.ps1 -SkipFrontend
```

The runner uses a fresh in-memory H2 database and the real Flyway migrations on
every execution. It never reads, resets, or writes the normal local/production
database.

The simulation covers:

- registration and login for seven managers;
- league creation, joining, settings and permission failures;
- league-admin player locking and position overrides;
- a complete 105-pick snake draft with positional and ownership checks;
- Captain / First Pick Captain and both IR usages;
- regular transfers, wrong-turn rejection and the three-player club limit;
- waiver preferences, fallback to the next preference and plan locking;
- manual transfer order, automatic turn progression and all 38 windows;
- synthetic stats, captain scoring, automatic substitutions and 38 gameweeks;
- league-specific assists and penalties-conceded adjustments;
- points history, standings data, fixture-day completion and season persistence;
- destructive season reset and identity restart at user ID 1;
- the existing backend test suite, frontend lint and production build.

The final gameweek remains `LIVE` but calculated, matching the current backend
behavior. There is currently no separate `FINISH_SEASON` operation; the annual
reset removes the completed season data.
