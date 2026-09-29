// Columns of public.profiles that PostgREST is allowed to return.
//
// public.profiles has an `email` column, but migration 012 withholds it
// from the anon and authenticated roles via column-level grants (RLS
// cannot restrict columns, privileges can). Postgres refuses to expand
// `*` into a column the calling role cannot read, so a `select *` on
// profiles now fails outright with "permission denied for table
// profiles". Name the columns explicitly, through this constant, and the
// app keeps working without leaking anyone's address.
//
// This must stay a *literal* type. supabase-js infers the shape of a
// result row by parsing the .select() string as a template literal type,
// and that inference collapses to a GenericStringError the moment this
// widens to a bare `string`. That rules out .join(), String.raw, and
// `+` concatenation of adjacent literals -- all three widen. One long
// literal with `as const` is the only form that survives.
//
// When you change this, change the GRANT in migration 012 to match.
//
// A user's own address comes from the auth session instead
// (authStore.user.email); everyone else's comes from the
// public.admin_search_users() RPC, which is admin-gated.
export const PROFILE_PUBLIC_COLUMNS = 'id, role, full_name, phone, avatar_url, university, faculty, year_of_study, bio, preferred_locale, is_suspended, created_at, updated_at' as const;
