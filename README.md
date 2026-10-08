# CondoMind

CondoMind is a condo management app. Managers run buildings, units, residents and maintenance requests. Residents (owners and tenants) submit and follow requests for their own units. New requests get a **Suggested triage**: a category, a priority and short notes.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | [Next.js 14](https://nextjs.org) (App Router, Server Components, Server Actions) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3, icons from `lucide-react` 1.46.0 |
| Database and auth | [Supabase](https://supabase.com): Postgres with Row Level Security, Supabase Auth via `@supabase/ssr` |
| Suggested triage | Google Gemini via `@google/genai` (`gemini-flash-latest` by default) |
| Linting | ESLint (`next/core-web-vitals`, `next/typescript`) |

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in:

   | Variable | Purpose |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (never the service role or secret key) |
   | `NEXT_PUBLIC_SITE_URL` | Public base URL of the app, used for redirects and the email confirmation link |
   | `GEMINI_API_KEY` | Server-only key for Suggested triage |
   | `GEMINI_MODEL` | Optional, defaults to `gemini-flash-latest` |

3. Apply the database schema: `supabase/schema.sql`, then the files in `supabase/migrations/` in order.

4. Start the dev server:

   ```bash
   npm run dev
   ```

   The app runs on port 3000.

5. Create the first manager account (see [Creating the first manager](#creating-the-first-manager)).

### Commands

- `npm run dev`: development server
- `npm run build`: production build and type check. Stop `npm run dev` first, because both write to `.next`.
- `npm run start`: serve the production build
- `npm run lint`: ESLint

## Flow

### 1. Sign up and log in

```
/login ──sign up──▶ confirmation email ──▶ /auth/confirm ──▶ /
   │
   └────log in──────────────────────────────────────────────▶ /
```

- `/login` has both modes (`?mode=signup` for sign up). The forms post to Server Actions in `src/app/login/actions.ts`.
- On sign up, a database trigger creates a `profiles` row from the user's `full_name`, with role `tenant`.
- `/auth/confirm` verifies the emailed token and signs the user in.
- `src/middleware.ts` refreshes the session on every request. It sends logged-out users to `/login`, except on `/login` and `/auth/confirm`.
- `/auth/signout` (POST) logs out.

### 2. Routing by role

`/` checks `profiles.role`:

- `manager` goes to `/manage`.
- `owner` or `tenant` goes to `/requests`.

### 3. Manager flow (`/manage`)

```
Create building ──▶ Add units ──▶ Add owners / tenants by email
                                            │
Resident submits request ◀──────────────────┘
        │
        ▼
Request page ──▶ Suggested triage runs ──▶ Manager adjusts status, priority, vendor ──▶ Resolved
```

1. **Buildings.** A manager creates a building through the `create_building` RPC, which links them to it. They can invite other managers by email (`invite_manager`) and remove them (`remove_manager`). A building always keeps at least one manager.
2. **Units.** The manager adds units to the building, with status `occupied`, `vacant` or `under_renovation`.
3. **Residents.** The manager adds an owner or tenant to a unit by email. When that email belongs to a confirmed account, a trigger links the row to the user. That user then sees the unit in `/requests`.
4. **Requests.** Opening a request with no triage notes runs Suggested triage. It sends the request to Gemini, which returns a category and a priority from fixed lists in `src/lib/labels.ts`, plus notes. The manager can then change the status (`open`, `in_progress`, `resolved`, `closed`), the priority and the assigned vendor.

#### Creating the first manager

Every new account starts as a `tenant`, and only an existing manager can invite another one. To create the first manager:

1. Sign up through `/login?mode=signup` and confirm the email.
2. Run this in the Supabase SQL editor, replacing the email:

   ```sql
   update public.profiles
   set role = 'manager'
   where id = (
     select id from auth.users
     where lower(email) = lower('you@example.com')
       and email_confirmed_at is not null
   );
   ```

3. Go to `/`. The role is read on every request, so you are sent to `/manage` and can create your first building.

After that, managers add each other from the **Invite a manager** form on a building's page. The invited person needs an account with a confirmed email.

### 4. Resident flow (`/requests`)

1. The resident sees their own units and those units' requests.
2. They submit a maintenance request for one of their units.
3. They follow its status as the manager works on it.

A database trigger limits what residents can write. On insert it resets status, priority, category, triage notes and vendor. The unit, submitter and submit time can't be changed later.

### 5. Access control

The pages and Server Actions check the user's role, but that is only for convenience. Row Level Security in Postgres is the real access control (`supabase/migrations/20261008140000_access_policies.sql`):

- Managers act only on buildings they are linked to in `building_managers`.
- Residents see only units where their `owners`/`tenants` row has their user id, and those units' requests.
- Suggested triage runs under the manager's session, so residents can't write triage results.

## Project layout

```
src/
  app/
    login/            log in / sign up page and actions
    auth/             email confirmation and sign out routes
    manage/           manager area: buildings, units, requests, triage
    requests/         resident area: units and requests
  components/         shared UI (shells, page header, tabs, badges, request row)
  lib/
    supabase/         server, browser and middleware clients
    auth.ts           getCurrentUser, requireManager, requireResident
    gemini.ts         Suggested triage client
    labels.ts         statuses, priorities, categories
    form.ts           redirect helpers for form results
  middleware.ts       session refresh and login gate
supabase/
  schema.sql          original public tables
  migrations/         roles, triggers, access policies, manager functions
```

Vendors are maintained in the Supabase dashboard. The app only reads them.
