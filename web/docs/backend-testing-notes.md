# Backend Testing Notes

We can test the backend migration in parallel without switching the live app yet.

## What We Can Test Right Now

- The current app still runs in `local` mode.
- Server status endpoint:
  - `/api/platform/status`
- Backend status endpoint:
  - `/api/backend/status`
- Database check endpoint:
  - `/api/backend/database-check`
- Bootstrap write/read endpoint:
  - `/api/backend/bootstrap-check`
- Practice sessions endpoint:
  - `/api/backend/practice-sessions`
- Practice session bootstrap write/update endpoint:
  - `/api/backend/practice-sessions/bootstrap-check`
- Practice dev reset endpoint:
  - `/api/backend/practice-sessions/dev-reset`

These routes let us confirm:

- environment mode
- whether auth config exists
- whether database config exists
- whether the database connection is actually live
- whether we can write and read a simple server-side record
- whether we can create, load, and list practice sessions server-side
- whether we can create, update, and re-read a real practice session row
- whether we can clear dev-only server Practice rows between tests
- whether the app now has a server-side Practice storage adapter ready for a safe later switch

## How We Should Test As We Build

1. Keep the app open the same way you do now.
2. Test UI changes in real time in the browser.
3. Open the status endpoints in a separate tab when backend pieces are added.
4. Keep `APP_STORAGE_MODE=local` until server persistence is proven.
5. When a server-backed feature is ready, enable only that slice behind a flag.

## After Supabase Is Created

Fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Then test:

- `/api/backend/status`
- `/api/backend/database-check`
- `/api/backend/bootstrap-check`
- `/api/backend/practice-sessions`
- `/api/backend/practice-sessions/bootstrap-check`
- `POST /api/backend/practice-sessions/dev-reset`

## Important Rule

The backend should be built beside the local app first.

Do not switch the whole app to server mode until:

- auth works
- database works
- progress save/load works
- cross-device checks pass
