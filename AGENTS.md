# Project Guidelines

## Project Overview

ELTE órarendtervező is a React application for selecting ELTE courses, finding compatible schedules, and sharing timetable plans.

## Architecture

- `client/` contains the Vite React application and browser state.
- `api/` contains thin Vercel endpoint adapters.
- `server/` contains external data access, parsing, and cache/database integration.
- `shared/` contains types and pure utilities used across the client and server.
- `migrations/` contains database schema migrations for the Neon Postgres database.
- Keep request handling in `api/`, reusable server logic in `server/`, and cross-boundary logic in `shared/`.

## Code Style

- Prefer the smallest clear solution that fits the existing design.
- Be strict about DRY: do not duplicate behavior, domain knowledge, constants, or transformations.
  Before adding code, look for an existing helper or nearby pattern to reuse.
- Extract a small function or shared abstraction when it removes real duplication or names an
  important concept. Do not add layers or configuration for theoretical flexibility.
- Keep code short and elegant. Use strict TypeScript and preserve useful inference.
- Prefer arrow functions for components, callbacks, and small helpers.
  The project favors compact expression-bodied code, even when that
  occasionally means using `&&`, `||`, `??`, `void`, or `,` instead of a more verbose
  statement-based form.
- Preserve the existing Hungarian UI terminology.

## Conventions

- Use `.js` extensions in server-side ESM imports.
- Reuse the existing endpoint, memoization, cache, context, and shared utility helpers.
- Use `DATABASE_URL` for Neon access and apply schema changes through migrations rather than request-time DDL.
- Keep schedule generation deterministic and handle incomplete or invalid course data explicitly.
- Treat URL sharing, browser storage, and cache formats as compatibility-sensitive.
- Keep browser-only code out of `server/` and `api/`.

## Validation

- Run `npx tsc --noEmit` for type-validation.
- Do not run formatting, linting or building commands unless explicitly requested.
