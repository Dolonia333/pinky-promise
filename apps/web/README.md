# Web app (Zion)

Screens for sign-in, upload codes, the builder profile, invites, pair reports, the 15-minute challenge, and the program room.

This folder does not replace `packages/cli` or `packages/shared`. Scoring for the command stays in `packages/shared`. These screens read a payload that already matches that schema.

## Upload

The command posts here:

```
POST /profiles
Content-Type: application/json

{ "code": "PP-7F3K", "payload": { } }
```

`POST /api/profiles` is the same handler.

Codes look like `PP-7F3K`: `PP-` plus 4 characters. They last 15 minutes and work once. The alphabet skips I, O, 0, and 1.

Success:

```
{ "id": "<uuid>", "url": "https://host/profile", "profileId": "<uuid>", "path": "/profile" }
```

The command uses `id` or `url`. A bad payload is `400`. A missing, used, or expired code is `401`. A payload over 50kb is `413`.

`POST /upload-codes` (signed in) returns `{ "code": "PP-7F3K", "expiresAt": "..." }` with status `201`.

## Running it

```bash
npm install
npm run dev --workspace @pinky-promise/web
```

With no `.env`, the app runs on a built-in local database that resets on restart, and email sign-in works. Copy `.env.example` to `.env` to use a real database:

| Variable               | What it is                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `DATABASE_URL`         | Postgres connection string. The Supabase transaction pooler link works.                  |
| `BETTER_AUTH_SECRET`   | Random string that signs sessions. Required with a real database: `openssl rand -hex 32` |
| `BETTER_AUTH_URL`      | The site's public address, like `https://pinkypromise.example`                           |
| `GITHUB_CLIENT_ID`     | From a GitHub OAuth app (GitHub settings, Developer settings, OAuth Apps)                |
| `GITHUB_CLIENT_SECRET` | From the same OAuth app                                                                  |
| `VITE_GITHUB_SIGN_IN`  | `true` to show "Continue with GitHub"                                                    |

The GitHub OAuth app's callback URL is `<BETTER_AUTH_URL>/api/auth/callback/github`.

Apply migrations to a real database with `npm run db:migrate --workspace @pinky-promise/web`.

## What is in here

- Landing, studio, profile, compare, invite (`/i/:token`), pair report
- Challenge board and program room
- Settings: feedback and delete-my-data
- Privacy, data handling, and terms
- Table definitions in `migrations/0002_pinky.sql`

Narratives on these pages are rules over the numbers. No model writes a score.
