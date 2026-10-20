# Production Deployment Guide: Vercel + Supabase + Cloudflare

## 1. Supabase Database & Auth Setup

1. Create a new Postgres project on [Supabase](https://supabase.com).
2. Enable PostGIS:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "postgis";
   ```
3. Run the migrations in order:
   ```bash
   supabase db push
   # OR execute in SQL Editor:
   # 1. supabase/migrations/20261020000001_initial_schema.sql
   # 2. supabase/migrations/20261020000002_rls_policies.sql
   # 3. supabase/migrations/20261020000003_seed_data.sql
   ```
4. Configure Authentication Providers:
   - Enable **GitHub OAuth**: Add Client ID and Client Secret from GitHub Developer settings.
   - Set Redirect URL: `https://<YOUR-DOMAIN>/api/auth/callback`.
   - Enable **Google OAuth** and **Email Magic Link**.

---

## 2. Vercel Deployment

1. Import GitHub repository into [Vercel](https://vercel.com).
2. Framework Preset: **Next.js**.
3. Set Environment Variables:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `CRON_SECRET`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
   - `GITHUB_TOKEN` (optional, raises the GitHub API rate limit)
4. Click **Deploy**.
5. Configure the scheduled jobs in `vercel.json`:

   ```json
   {
     "crons": [
       { "path": "/api/matching/precompute", "schedule": "0 3 * * *" },
       { "path": "/api/notifications/push", "schedule": "*/5 * * * *" }
     ]
   }
   ```

   Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically. Both
   routes reject any other caller with `401`. GitHub stats are refreshed by
   the user from `/settings` (`POST /api/profile/sync-github`), not by cron.

---

## 3. Cloudflare DNS, SSL & Edge Caching

1. In Cloudflare, add custom domain (`hackpact.dev`).
2. Add CNAME record pointing `@` and `www` to `cname.vercel-dns.com` (with Orange Cloud Proxy enabled).
3. Under **SSL/TLS**, set mode to **Full (strict)**.
4. Under **Security > WAF**, configure rate limiting rules:
   - Max 100 requests per minute per IP on `/api/*`.
5. Under **Rules > Page Rules**, enable Edge Cache TTL for static hackathon feed and public profile routes (`/p/*` and `/hackathons/*`).
