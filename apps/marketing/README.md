# Marketing Website

Public **Olimpia** website and landing page — Next.js static export.

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page (M1) |
| `/learn/usdc` | USDC education (M2) |
| `/llms.txt` | Agent/crawler summary |
| `/privacy` | Privacy placeholder |
| `/terms` | Terms placeholder |

## Development

From repo root:

```bash
npm install
npm run dev:marketing
```

Open [http://localhost:3000](http://localhost:3000).

## Build (static export)

```bash
npm run build:marketing
```

Output: `apps/marketing/out/` — deploy to Vercel, Netlify, or any static host.

Preview production build:

```bash
cd apps/marketing && npx serve out
```

## Waitlist

Download CTAs open a waitlist modal. By default emails are stored in `localStorage` for demo.

Set `NEXT_PUBLIC_API_URL` in `.env.local` to POST to `{API_URL}/api/v1/waitlist` when the backend is ready.

## Design sources

- `docs/brand/Brand.md`
- `docs/brand/DesignReferences.md`
- `packages/design-system/tokens.css`
