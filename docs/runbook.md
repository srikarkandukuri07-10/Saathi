# Hackpact Operational Runbook

## 1. Local Development Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local

# 3. Run database migrations (Supabase CLI)
supabase db push

# 4. Start Next.js development server
npm run dev

# 5. Execute test suite
npm run test
npm run typecheck
```

---

## 2. Daily Database Backup & Disaster Recovery

### Automated Backups
- Supabase provides automated continuous Write-Ahead Log (WAL) archiving and daily logical snapshots.
- Manual off-site backup cron (nightly):
```bash
pg_dump -Fc --no-acl --no-owner -h db.<PROJECT-REF>.supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d).dump
```

### Restore Procedure
1. Provision target Postgres instance.
2. Enable PostGIS extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```
3. Restore from binary dump:
   ```bash
   pg_restore --clean --if-exists -h <RESTORE_HOST> -U postgres -d postgres backup_20261020.dump
   ```
4. Verify table counts and RLS status:
   ```sql
   SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
   ```

---

## 3. Admin Concierge Manual Matching Tool

When onboarding the first 50 users in Hyderabad:
1. Navigate to `/admin/concierge`.
2. Inspect new signups in the concierge queue filtered by college or hackathon target.
3. Select User A and User B. The UI checks skill complementarity and goal alignment in real time.
4. Click **"Introduce via Concierge"**.
5. Both users receive an in-app and email notification: *"Hackpact Concierge suggested a match for Smart India Hackathon: User A & User B"*.
6. Mutual accept is auto-consented, opening an introductory team workspace chat immediately.
