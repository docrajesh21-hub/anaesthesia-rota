# AnaesthRota

Full-stack rota (scheduling) system for an anaesthesia partners group.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database & Auth**: Supabase (Postgres + Auth)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Deployment**: Vercel
- **Language**: TypeScript

## Project Structure

```
app/                  # Next.js App Router pages and layouts
components/           # Shared React components
  ui/                 # shadcn/ui primitives
lib/                  # Utilities, Supabase client helpers
public/               # Static assets
```

## Environment Variables

Required in `.env.local` (never commit this file):

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (safe for browser)
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server-only, never expose to client)

## Supabase

- Project URL: `https://meoiivafhwtcqjarqxct.supabase.co`
- Client-side: use `@supabase/ssr` `createBrowserClient`
- Server-side: use `@supabase/ssr` `createServerClient` with cookie handling

## Development

```bash
npm run dev     # Start dev server on http://localhost:3000
npm run build   # Production build
npm run lint    # ESLint
```

## Key Domain Concepts

- **Partner** — a consultant anaesthetist in the group
- **Session** — a scheduled work block (theatre list, on-call, etc.)
- **Rota** — the published schedule for a given period
- **Leave** — annual leave, study leave, etc. that blocks availability
