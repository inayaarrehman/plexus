# Plexus × Supabase — setup checklist

This project is **Vite + React** (deployed on Vercel), so browser env vars use
the **`VITE_`** prefix, not `NEXT_PUBLIC_`. The two you asked about map like so:

| You mentioned (Next.js)        | Use in this project (Vite)   |
| ------------------------------ | ---------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`     | `VITE_SUPABASE_URL`          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| `VITE_SUPABASE_ANON_KEY`     |

**Nothing breaks if you skip this.** Until these are set, Plexus runs exactly as
before (bundled content + localStorage). Supabase is an additive layer.

---

## 1. Find your Supabase credentials
Supabase Dashboard → your project → **Project Settings → API**:
- **Project URL** → this is your `VITE_SUPABASE_URL`
- **Project API keys → `anon` `public`** → this is your `VITE_SUPABASE_ANON_KEY`
- **Project API keys → `service_role` `secret`** → `SUPABASE_SERVICE_ROLE_KEY`
  (used **only** by the import script on your machine — never in the browser or Vercel browser env)

## 2. Run the database schema (library only, for now)
Supabase Dashboard → **SQL Editor → New query** → paste the entire contents of
`supabase/migrations/0001_library.sql` → **Run**. This creates the Library/Editor
backend: `profiles` (+ `is_admin`), `sources`, `concepts`, `concept_sources`,
`connections`, `connection_concepts`, `connection_sources` — with indexes,
`updated_at` triggers, the `is_admin()` helper, and all Row Level Security.

Do **not** run `supabase/migrations/0002_daily_race.sql` yet — that one adds
Daily Plexus and Race Mode tables and is for a later phase.

## 3. Add env vars locally
Copy `.env.example` to `.env.local` in the project root and fill in:
```
VITE_SUPABASE_URL=...            # Project URL
VITE_SUPABASE_ANON_KEY=...       # anon public key
SUPABASE_SERVICE_ROLE_KEY=...    # service_role secret (import script only)
```
`.env.local` is gitignored — it will not be committed.

## 4. Install deps & import existing content (one time)
```
npm install
node --env-file=.env.local scripts/importToSupabase.mjs
```
This imports every **verified** connection in the bundled bank into Supabase as
`connections` + reusable `concepts` + links. It is **idempotent** — safe to
re-run, never duplicates, never deletes. (It uses the service_role key, which is
why it runs locally only.)

## 5. Make yourself an admin (so you can use the Editor)
First **sign in once** in the app (or create a user in Supabase → Authentication
→ Users). Then Supabase → SQL Editor:
```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'YOUR_EMAIL_HERE');
```

## 6. Add env vars in Vercel
Vercel → your project → **Settings → Environment Variables**. Add:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

(Do **not** add `SUPABASE_SERVICE_ROLE_KEY` to Vercel — it must stay off the
browser/build env.) Set them for Production (and Preview/Development if you want).

## 7. Redeploy
Vite inlines `VITE_` vars at **build time**, so after adding them in Vercel you
must trigger a **new deployment** (push a commit, or Vercel → Deployments →
Redeploy). Local dev picks up `.env.local` on `npm run dev` restart.

## 8. Verify the connection works
- Open the app at `#dev` (e.g. `your-site/#dev`) → **Editor** tab.
  - If it says **"Editor is not connected yet"**, the env vars aren’t loaded yet.
  - If it shows the Connections/Concepts/Sources lists with your imported rows,
    the database connection is working.
- The tab label reads **Editor (Supabase)** when configured, **Editor (offline)**
  when not.

## 9. Test the Editor
In `#dev` → **Editor**:
- Switch between **Connections / Concepts / Sources**, search and filter.
- **+ New** to create; **Edit** to update; **Archive/Unarchive**; change
  **verification status** in the form. Writes require an **admin** session
  (RLS blocks non-admins — the header tells you your current role).

---

### What’s functional now vs. scaffolded
- **Functional after the steps above:** DB schema + RLS, content import, the
  Supabase-backed Editor (concepts/connections/sources CRUD, archive, verify,
  search), auth (magic link / email+password) + profiles, official Daily read +
  per-user results, and deterministic seeds (`PLEXUS-YYYY-MM-DD`).
- **Scaffolded foundation (code ready, final UI wiring later):** live Race Mode
  realtime — `src/lib/raceRepo.js` implements the real Supabase Realtime
  Presence/Broadcast channel and race/race_players rows. The current Race screen
  still runs the seeded set solo and shows the opponent as **offline** (it never
  fakes an opponent); wiring the two-client live view is the remaining step.

### Admin / editor separation
Regular users can only read public verified content + published dailies and
manage their own profile/results/races. Editing concepts, connections, sources
and official daily puzzles requires `profiles.is_admin = true`, enforced by RLS.
