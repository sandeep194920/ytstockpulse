# Supabase & Migrations

> How we connect to Supabase, how migrations work, and the two different keys and when to use each.

---

## Two Keys, Two Purposes

| Key | Env var | Used by | Access |
|-----|---------|---------|--------|
| Publishable key | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Next.js frontend (browser) | Read-only via RLS policies |
| Service role key | `SUPABASE_SERVICE_ROLE_KEY` | Python pipeline scripts (server only) | Full access, bypasses RLS |

**Never put the service role key in any `NEXT_PUBLIC_` variable.** It would be exposed in the browser bundle.

The publishable key was previously called the "anon key" — Supabase renamed it. The functionality is identical.

---

## Connecting from the Frontend (Next.js)

`lib/supabase.ts` exports two clients:

```typescript
// For use in Server Components and API routes (can use service role if needed)
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// For use in Client Components (browser-safe, publishable key only)
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)
```

In practice: most data fetching in this app happens in Server Components (faster, no client-side waterfall), so `supabaseServer` is the one used most.

---

## Connecting from Python Scripts

```python
from supabase import create_client
import os

supabase = create_client(
    os.environ["NEXT_PUBLIC_SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)
```

The scripts use `python-dotenv` to load `.env.local` automatically at the top of each file:
```python
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env.local")
```

---

## Migrations

All schema changes are tracked as numbered SQL files in `supabase/migrations/`:

```
supabase/migrations/
  001_initial_schema.sql   — all tables, indexes, RLS policies
  002_seed_channels.sql    — first batch of vetted channels
  003_add_avatar_url.sql   — added avatar_url to youtubers
```

### Applying migrations

```bash
# One-time setup (link your local CLI to the remote project)
npx supabase login   # authenticate with your access token
npx supabase link --project-ref uqrgmbgljtntqpcrwhjr

# Apply any unapplied migrations
npx supabase db push

# Check migration status
npx supabase migration list
```

### Adding a new migration

```bash
# Create the next numbered file
touch supabase/migrations/004_your_change_here.sql

# Write your SQL, then apply it
npx supabase db push
```

**Never modify an already-applied migration.** If you need to change something, write a new migration that alters the existing structure. This preserves history and keeps prod in sync with what the migration files describe.

### Why migrations, not the Supabase dashboard?

If you make schema changes directly in the Supabase SQL editor, those changes live only in that one database. When you eventually need a second environment (staging, prod), or if you need to recreate the DB from scratch, those changes are lost. Migration files in the repo mean the schema is always reproducible and version-controlled alongside the code.

---

## Project Reference

- **Project ref:** `uqrgmbgljtntqpcrwhjr`
- **Region:** AWS us-east-1
- **DB URL:** in `.env.local` as `SUPABASE_DB_URL`

---

## RLS Quick Reference

Row Level Security policies determine what the publishable key can read/write:

| Table | Policy |
|-------|--------|
| `stocks` | Anyone can read |
| `youtubers` | Anyone can read `status = 'active'` rows |
| `mentions` | Anyone can read |
| `explainers` | Anyone can read |
| `channel_submissions` | Anyone can insert (suggest a channel), no read-back |
| `monthly_snapshots` | No public policy — service role only |

The Python pipeline uses the service role key which bypasses all RLS policies.
