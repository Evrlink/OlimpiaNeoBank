# Shared Types

Shared TypeScript types used across **Olimpia** apps and packages.

## What belongs here

- Domain models (user, balance, transaction, goal, card)
- API request/response shapes (aligned with `docs/architecture/Architecture.md` routes)
- Enums and union types for normalized async states (`pending`, `processing`, etc.)
- Types consumed by marketing, mobile, and backend (`apps/api/` later)

## Out of scope

- Runtime validation schemas (can live here or in a future `packages/validation/`)
- UI component prop types tied to a single app — prefer colocation unless shared
- Generated provider SDK types (import from vendor packages)

## Status

Folder scaffold only — no type definitions yet.
