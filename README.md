# Janet Sales Calendar (Gen2)

Mobile-first PWA for medical sales reps to manage doctor follows, schedule planning, OCR upload flow, and daily digest reminders.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS
- Supabase (Auth/DB/API)
- Vercel deployment target
- Vitest + Testing Library

## Local Development

```bash
npm install
cp .env.example .env
npm run dev
```

## Test and Build

```bash
npm run test
npm run build
```

## Credential Safety Policy

- Do not reuse Supabase/Vercel/Google/Stripe secrets from other projects.
- Fill only new project credentials in `.env`.
- See `docs/setup-auth-handoff.md` for final authorization checklist.

## Supabase Schema

Initial schema migration is in:

- `supabase/migrations/20260228070000_init_plan_a.sql`

Apply it after you connect a brand-new Supabase project.
