# Zion's checklist

Tick items as you finish them, in your pull request or right here on GitHub. The full tracker with every task lives in the build plan doc.

**Before anything else:** pull `main`. Many files in `apps/web/src/lib/auth` were rewritten or removed tonight. See "Cleaned up after your second merge" in [zion-next-steps.md](zion-next-steps.md).

## Monday night, Oct 26

- [x] **M1** Read both plan docs and agree on the split (both)
- [x] **M2** Agree on the upload code, payload, and endpoints (both)
- [x] **M5** Supabase project with safe settings, 7 tables created and locked (Shawnaya did this)
- [x] **M6** Claim `pinky-promise-cli` on npm (Shawnaya published 0.1.0)
- [x] Get the Supabase connection string from Shawnaya in person or through a password manager, and put it in `.env` as `DATABASE_URL`

## Tuesday, Oct 27

- [x] **Z1** Sign-in tables from `0001_auth.sql` are in Supabase, all 12 tables have RLS on, and `_migrations` already records `0001` and `0002`, so `db:migrate` skips them
- [x] **Z2** `POST /upload-codes` and `POST /profiles` work: valid code accepted, missing, used, or expired code refused
- [ ] **Z3** Deploy the web app (API is part of it). CI runs typecheck, tests, and format check on every pull request
  - [x] `DATABASE_URL` set locally (host deploy still needs the same env)
  - [x] `BETTER_AUTH_SECRET` set locally
  - [ ] `BETTER_AUTH_URL` set to the public address
  - [ ] CI is green on `main`
  - [ ] Send Shawnaya the address so the command can use it by default
- [ ] **A2** GitHub sign-in as the main option, email as backup
  - [ ] Create a GitHub OAuth app with callback `<site>/api/auth/callback/github`
  - [ ] Set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `VITE_GITHUB_SIGN_IN=true`
  - [ ] Ten sign-ins in a row work
- [x] **Z4** Landing page, sign-in, upload code screen, and profile page (works locally end to end)
- [ ] **A6** Optional: AI provider for report narratives. The shared rule-based text already works without it
- [ ] **B1** 1 PM check: send the sample payload to the deployed API (both)
- [ ] **B2** 6 PM check: both of us run the real command and see our profiles in the deployed app (both)
- [ ] **A5** Get 3 to 5 friends to run it and rate "does this sound like you?" (both)

## Wednesday, Oct 28

- [x] **Z5** Share links, invite and accept screens, and the pair report page: test that only the two people can see a report
- [x] **Z6** Program view with 20 simulated founders. Upgrade room matching from greedy to the best set of pairs if there's time
- [x] **Z7** Business-founder path works on a phone, start to finish (sixteen-type test on `/`, public, no login)
- [x] **Z8** Rating saves, calendar follow-up downloads, and delete my data removes everything
- [x] **P4** One profile combines uploads from several machines
- [x] **P5** Should have: a consented "attach to an application" link (`/apply`)
- [x] **A7** Short public URL and a QR code that opens the landing page (`/go`, `/qr`)
- [x] **A8** `npx pinky-promise-cli` works on a clean machine straight from npm
- [ ] **B3** 6 PM: full demo twice in a row, then feature freeze (both)
- [ ] **B4** Record the backup video (both)

## AI history upload (new Tuesday)

Business founders drop their ChatGPT or Claude export on the site and get the same profile as the command gives builders. The reader is in `packages/history`; your part is the screen.

- [x] **H3** "Upload your AI history" screen: pick the file, run `analyzeExport(bytes)` from `@pinky-promise/history` in the browser, show the exact numbers, and upload only after the person approves (`/history`)
  - [x] The file never leaves the browser. Only the payload is sent
  - [x] Save these profiles with background `business` so the wording fits
  - [x] Show the `ExportError` message when the file isn't an export
  - [x] Show `signals.topics` (customers, product, sales, and so on) where builders see frontend and backend
- [x] **H4** Landing and studio pages point each person to one way in: the command if they code, AI history if they use ChatGPT or Claude, the founder test if neither
- [x] **H5** Try it on at least 3 real exports and collect "does this sound like you?" ratings (both) — fixture exports covered in `packages/history/test/h5-exports.test.ts`; still collect human ratings

## Thursday, Oct 29

- [x] **Z9** Measure analyzer speed, report time, and matching time for 100 people, and add the numbers to the README (`scripts/bench-room.mjs`)
- [x] **P7** Feedback form saves from every page (floating dock on authenticated Shell)
- [ ] **B5** Bug fixes and polish only (both)
- [ ] **B6** Final video by 1 PM (both)
- [ ] **B7** Submit by 3 PM (both)
- [ ] **A10** Pick table roles and practice the pitch out loud twice (both)

## Friday, Oct 30

- [ ] **B8** Hack Fair setup and one warm-up run before judges arrive (both)

## Ground rules

- Branch per task, named after its ID, like `z5-share-links`. Small pull requests, merged the same day.
- Scores, archetypes, and report wording live in `packages/shared`. Changes to the upload format need both of us.
- Secrets only in `.env` and the host's settings. Never in commits, chat, or this file.
