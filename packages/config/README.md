# Shared Config

Shared project configuration for the **Olimpia** monorepo.

## What belongs here

- ESLint, Prettier, TypeScript base configs
- Shared Babel / Metro / bundler presets (when apps are scaffolded)
- Environment variable naming conventions and `.env.example` patterns
- Monorepo tooling config (e.g. workspace references)

## Out of scope

- App-specific native config (Xcode, Gradle) — see `apps/mobile/`
- Runtime secrets or committed `.env` files
- Design tokens — see `packages/design-system/`

## Status

Folder scaffold only — no config files yet.
