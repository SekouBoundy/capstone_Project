# DOUCSOFT Admin

Web admin panel for the DOUCSOFT app. It is a standalone Vite + React SPA that
talks to the **same Supabase project** as the Expo mobile app in the repository
root — one set of accounts, one set of RLS policies, one database.

## Running it

```bash
cd admin-web
npm install
npm run dev      # http://localhost:5173
```

No separate `.env` is needed. `vite.config.ts` sets `envDir: '..'`, so the
panel reads the **repository root `.env`** and reuses the app's
`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` variables. If you
have not set those up yet, copy `.env.example` to `.env` at the root.

cd /Users/boundy/Desktop/Code/capstone_Project/admin-web
npm run dev

## Signing in

Use a normal app account that has `role = 'admin'` in `profiles`. The panel
asks the database (`is_admin()`) on every sign-in rather than trusting a cached
role, so suspending an admin locks them out on their next visit.

To make someone an admin:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'you@example.com';
```

## What it manages

| Screen | Actions |
| --- | --- |
| **Dashboard** | User/property/item counts, with the two queues that need a human promoted to the top |
| **Users** | Search by name, email or university; filter by role and status; change roles; suspend and reactivate |
| **Verifications** | Review owner/agency applications with document links; approve (which promotes the role) or reject with a reason |
| **Reports** | Triage by status and reason; resolve, investigate or dismiss with an internal note |
| **Moderation** | Remove and restore housing listings and marketplace items; removals require a reason and notify the owner |

Every action that changes something visible to a user writes a notification, so
the reason an admin typed reaches the person affected.

## Security model

Authorisation lives in the database, not the browser. All ten functions in
`supabase/migrations/014_admin_web_panel.sql` are `SECURITY DEFINER` with an
empty `search_path` and an explicit `public.is_admin()` gate, and `EXECUTE` is
granted to `authenticated` only.

The `RequireAdmin` route guard is UX, not a boundary — it decides what to show
a signed-in non-admin, but a non-admin calling the RPCs directly still gets
`42501 admin privileges required`.

Two consequences of the schema are worth knowing if you extend the panel:

- **Clients cannot write `profiles.role` or `profiles.is_suspended`.** Migration
  011 revoked the blanket `UPDATE` and re-granted a column list that excludes
  them, precisely so a user cannot promote themselves. Role and suspension
  changes go through `admin_set_role()` / `admin_set_suspended()`.
- **`profiles.email` is not readable by clients.** It exists for admin tooling
  and joins, withheld by column-level grants (migration 012) so the
  "profiles are viewable by everyone" policy cannot leak every user's address.
  Admin code reaches it through the `SECURITY DEFINER` RPCs, which join
  `auth.users`.

A `select *` on `profiles` fails outright for this reason — Postgres will not
expand `*` into a column the role cannot read. Name columns explicitly.

## Changing a query

`src/lib/types.ts` mirrors the `RETURNS TABLE` shapes of the RPCs by hand; the
project has no checked-in `supabase gen types` output. If you change a
function's return signature in SQL, update the matching interface and the
wrapper in `src/lib/api.ts` together, or the two will drift silently.
