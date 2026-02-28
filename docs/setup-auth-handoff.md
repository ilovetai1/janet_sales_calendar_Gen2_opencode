# Auth And Deployment Handoff

This project is prepared to avoid reusing credentials from older projects.

## 1) Supabase

1. Create a brand-new Supabase project.
2. Copy `.env.example` to `.env`.
3. Fill `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` with values from the new project.
4. Run schema migration files under `supabase/migrations/`.

## 2) Google OAuth

1. Create a new OAuth app in Google Cloud Console.
2. Fill `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
3. Set callback URL to the new deployment domain (not old projects).

## 3) Stripe/Webhook (if enabled)

1. Create new Stripe API keys and webhook endpoint.
2. Fill `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.

## 4) Vercel

1. Create a new Vercel project.
2. Add env vars from `.env.example` into Vercel project settings.
3. Fill `VERCEL_PROJECT_ID` and `VERCEL_ORG_ID` if you use Vercel API automation.

## 5) Final smoke test

1. `npm install`
2. `npm run test`
3. `npm run build`
4. `npm run dev`

If all steps pass, run one final deploy flow with your own new credentials.
