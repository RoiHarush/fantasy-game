# Frontend Architecture

The frontend uses Next.js App Router as a server-first application, with client
components reserved for interaction and browser APIs.

## Core boundaries

- `app/` owns routes, layouts, metadata, loading/error boundaries, and server-side redirects.
- `src/server/` is server-only code. It may read HttpOnly cookies and call the Spring backend directly.
- `src/services/` contains the browser API transport and feature API functions.
- `src/features/` contains feature-owned Query hooks and Zod schemas. New remote
  state hooks belong here rather than inside page components.
- `src/lib/` contains framework-level infrastructure such as Query and class-name utilities.
- `src/shared/ui/` contains reusable accessible UI primitives built on Radix and Tailwind.
- `src/Components/Pages/` is legacy feature UI and is migrated incrementally without changing routes.
- `src/Context/` is limited to genuine client state and compatibility providers. Remote server state belongs in TanStack Query.

## Authentication

- The JWT is stored only in the `fantasy_session` HttpOnly cookie.
- Browser JavaScript never reads or stores the JWT.
- Next.js validates the session on the server before rendering protected layouts.
- Spring remains the authority for authentication and authorization.
- Unsafe cookie-authenticated requests use Spring CSRF protection through
  `XSRF-TOKEN` / `X-XSRF-TOKEN`.
- Bearer authentication remains supported for the season simulation and other non-browser tools.

## Data ownership

- Spring and the database are the source of truth.
- TanStack Query owns fetched client-side server state, caching, invalidation, and optimistic mutations.
- Query keys are created only through `src/lib/query/keys.js`, so HTTP loads,
  WebSocket updates, mutations, and invalidation always address the same cache entry.
- React Context is not used as a second server-state cache.
- WebSocket messages invalidate or update Query data; reconnects always reconcile with HTTP state.

## Styling and UI

- Tailwind CSS v4 supplies utilities and CSS-first design tokens from `app/globals.css`.
- Radix supplies behavior and accessibility for complex primitives such as dialogs.
- `class-variance-authority`, `clsx`, and `tailwind-merge` power reusable variants.
- CSS Modules remain supported for complex existing screens during migration.
- New inline style objects are avoided except for truly runtime-calculated values.

## Forms

- React Hook Form owns field state, dirty state, and submission state.
- Zod schemas in `src/features/<feature>/schemas.js` define client-side validation.
- Spring validates authorization and business rules and remains authoritative.
- Server errors are rendered as accessible form alerts; field errors are associated
  with their inputs.

## Component state

- Query owns data received from Spring.
- Local React state is reserved for unsaved drafts and transient UI state such as
  active tabs, open dialogs, and selections.
- A keyed editor component initializes an unsaved draft from Query data without a
  synchronization effect. Successful mutations update the shared Query cache.

## Migration rule

Each feature migration must preserve its public route and behavior, pass `npm run lint`
and `npm run build`, and remove its corresponding legacy lint exception when its effects
have moved to Query or derived render state.
