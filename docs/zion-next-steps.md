# Next steps for Zion

The analyzer command, scoring, and report logic are done and on `main`. Everything below is what's left on the server and web side, in the order it unblocks the demo.

## Synced after your first merge

Your web code now uses `packages/shared` as the one source for the upload format, scoring, and report text, so the terminal and the website always agree. What changed in `apps/web`:

- `payload.ts` and `types.ts` use the shared schema and types. Scores and some signals can be `null`, and areas only list what someone touched. `ScoreBars` shows "Not enough data" and `Areas` shows 0% for missing areas.
- `fit.ts` wraps the shared archetype, "co-founder you need," tips, and pair report. Your evidence lines, profile merging, and calendar file stay, now safe with missing data. Business founders still read as product, the build, roles, and proof.
- `redeemCode` recomputes scores with `scoreProfile`, refuses uploads that claim to be challenges, and claims the code in one `update ... returning` so it can't be used twice.
- `matchRoom` checks for "Mirror Match" instead of "The Echo."
- Your tests moved to Vitest, so `npm test` runs them with everything else.

**Still needed from you:** the files the app imports that aren't in the repo (`src/lib/db`, `src/lib/auth/*`, the router and root route, the Vite config, `migrations/0001`, and the dependencies in `apps/web/package.json`). Until those are pushed, the app can't run from a fresh clone.

## Where things stand

| Done (Shawnaya)                                                       | Where                  |
| --------------------------------------------------------------------- | ---------------------- |
| `analyze` command with preview, yes prompt, upload code, and upload   | `packages/cli`         |
| Payload schema, scoring rubric, confidence labels                     | `packages/shared`      |
| Archetypes, "co-founder you need," "how to work with me," pair report | `packages/shared`      |
| Sample payloads to build against                                      | `packages/shared`      |
| Empty folders for your work                                           | `apps/api`, `apps/web` |

Run `npm install && npm test` once to make sure everything works on your machine.

## What you can use from `packages/shared`

Import everything from `@pinky-promise/shared`. It's TypeScript source, so run the API with `tsx` or bundle it with `tsup` (the CLI does this already in `packages/cli/tsup.config.ts`).

| Export                                    | Use it for                                                      |
| ----------------------------------------- | --------------------------------------------------------------- |
| `payloadSchema`                           | Validate every upload in `POST /profiles`. Rejects extra fields |
| `scoreProfile(signals, counts)`           | Recompute scores on the server instead of trusting the upload   |
| `profileArchetype(scores)`                | Archetype name and tagline for the profile page                 |
| `cofounderYouNeed(payload)`               | The "co-founder you need" summary                               |
| `howToWorkWithMe(payload)`                | Up to four tips for the profile page                            |
| `compareFounders(a, b)`                   | The full pair report for `GET /reports/:id`                     |
| `samplePayload`, `samplePartnerPayload`   | Two test profiles that make a good pair report                  |
| `DIMENSIONS`, `DIMENSION_LABELS`, `AREAS` | Labels for the UI                                               |

`packages/shared/sample-payload.json` is the same sample as plain JSON, handy for curl or seeding the database.

## One change to the agreed payload

A score can be `null` with confidence `"none"` when there's no data for it. For example, someone with git history but no Claude Code sessions gets no Planning score. Show "Not enough data" on the profile page instead of 0.

## The contract the command expects

The command sends:

```http
POST /profiles
Content-Type: application/json

{ "code": "PP-7F3K", "payload": { ... } }
```

Your API should:

1. Look up the upload code. If it's missing, used, or older than 15 minutes, return `401`. The command tells the person to get a new code.
2. Validate with `payloadSchema.safeParse(body.payload)`. If it fails, return `400`.
3. Recompute `scores` and `confidence` with `scoreProfile(payload.signals, payload.counts)` and save those, not the uploaded ones. This is our answer when judges ask "can't someone fake their scores?"
4. Save one row per upload, mark the code as used, and return `201` with `{ "url": "https://<web app>/profiles/<id>" }`. Returning `{ "id": "<id>" }` also works.

Upload codes look like `PP-` plus 4 uppercase letters or digits. The command checks that format before sending.

Once the API is deployed, send me the address. I'll set it as the default in the command so people don't have to pass `--api`.

To test without running the analyzer:

```bash
curl -X POST http://localhost:8787/profiles \
  -H "content-type: application/json" \
  -d "{\"code\":\"PP-TEST\",\"payload\":$(cat packages/shared/sample-payload.json)}"
```

To test with the real command against your local API:

```bash
npm run analyze -- --all --api http://localhost:8787
```

## Tables you need first

Enough for Tuesday's checks. The rest of the data model in the plan can come Wednesday.

| Table              | Columns                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `upload_codes`     | `code`, `user_id`, `expires_at`, `used_at`                                                                 |
| `builder_profiles` | `id`, `user_id`, `sources`, `counts`, `signals`, `scores`, `confidence`, `analyzer_version`, `uploaded_at` |
| `profile_ratings`  | `profile_id`, `user_id`, `rating` (1 to 5), `created_at`                                                   |
| `share_links`      | `token`, `from_user_id`, `accepted_by_user_id`, `report_id`, `created_at`                                  |
| `pair_reports`     | `id`, `user_a`, `user_b`, `report` (JSON from `compareFounders`), `created_at`                             |

Security rules: people can only read their own profiles and ratings, and a pair report only if they're one of the two people in it. Only the API (service role) writes scores and reports.

## Your tasks, in order

### Tonight (Monday)

- [ ] **M5** Create the Supabase project and share keys through `.env` (never in chat or commits). Add `.env.example` with names only.
- [ ] **M6** Claim `pinky-promise-cli` on npm. From the repo: `npm run build`, then `cd packages/cli && npm publish`. It's already set up to publish only the built `dist` folder.

### Tuesday

- [ ] **Z1** Tables above plus security rules
- [ ] **Z2** `POST /upload-codes` and `POST /profiles` (contract above)
- [ ] **A2** GitHub sign-in as the main option, email as backup
- [ ] **Z3** Deploy the API and web app. CI on pull requests runs `npm run typecheck`, `npm test`, and `npm run lint`
- [ ] **Z4** Web: landing page, sign in, "Get upload code" screen with a countdown and the command to copy, and the profile page
- [ ] **A6** AI provider key for report narratives in `.env`. The rule-based text from `packages/shared` is the fallback, so the report always renders
- [ ] **1 PM check** Send the sample payload to the deployed API
- [ ] **6 PM check** We both run the real command and see two profiles in the app

### Wednesday

- [ ] **Z5** Share links, invite and accept screens, and the pair report page using `compareFounders`
- [ ] **P4** One profile that combines uploads from several machines
- [ ] **Z6** Cohort matching and program view with 20 simulated founders
- [ ] **Z8** "Does this sound like you?" rating, calendar follow-up, and delete my data
- [ ] **A7** Short URL, QR code, and privacy, data handling, and terms pages in the footer
- [ ] **Z7** Business-founder challenge screens (should have)
- [ ] **P5** Consented "attach to an application" link (should have)
- [ ] **A8** Test `npx pinky-promise-cli analyze` on a clean machine straight from npm
- [ ] **6 PM** Full demo twice in a row, then feature freeze

### Thursday

- [ ] **Z9** Measure analyzer speed, report time, and matching time for 100 people, and add the numbers to the README
- [ ] **P7** Feedback button on every page
- [ ] Final video by 1 PM, submit by 3 PM

## Profile page checklist

The profile page is what every judge sees first, so it should show:

- Archetype name and tagline
- Five scores with a bar, the confidence label, and "Not enough data" for null scores
- The "co-founder you need" summary
- "How to work with me" tips
- "Does this sound like you?" 1 to 5 rating
- "Compare with someone" button

## Ground rules

- Small pull requests, merged the same day, so `main` always runs
- Branch names use the task ID, like `z2-profiles-endpoint`
- Changes to `packages/shared/src/payload.ts` need both of us
- Secrets only in `.env` and hosting settings
