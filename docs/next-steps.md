# Status and next steps

Last updated Monday night, Oct 26. Shawnaya's part of the build plan is in place; this note covers what's done, what Zion needs to build against, and what comes next for each of us.

## Done

| Task       | What                                                                 | Where                                                                       |
| ---------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| M2         | Sample payload agreed and committed                                  | `packages/shared/sample-payload.json`                                       |
| M4         | Workspace skeleton                                                   | `packages/*`, `apps/*`                                                      |
| S1         | Git history reader, own commits only, last 12 months                 | `packages/cli/src/sources/git.ts`                                           |
| S2         | Claude Code session parser                                           | `packages/cli/src/sources/claude-code.ts`                                   |
| S3         | Allowlist redaction with a privacy test                              | `packages/cli/src/payload.ts`, `packages/cli/test/privacy.test.ts`          |
| S4, A4     | Signals and scoring rubric                                           | `packages/cli/src/signals.ts`, `packages/shared/src/scoring.ts`             |
| S5, P3, A3 | `analyze` command: warning, preview, yes prompt, upload code, upload | `packages/cli/src/analyze.ts`                                               |
| S6, P2     | "The co-founder you need" and "how to work with me"                  | `packages/shared/src/profile.ts`                                            |
| S7, P1     | Archetypes and the pair report                                       | `packages/shared/src/archetypes.ts`, `packages/shared/src/compatibility.ts` |
| P8         | Local-only highlights printed in the terminal, never uploaded        | `packages/cli/src/highlights.ts`                                            |

`npm test` runs 81 tests, all passing.

## What Zion builds against

### Upload

The command sends one request after the person types yes and pastes their code:

```
POST /profiles
{ "code": "PP-7F3K", "payload": { ...see sample-payload.json } }
```

The command expects back either `{ "url": "https://..." }` or `{ "id": "..." }`. If it only gets an id, it shows `<api>/profiles/<id>`.

| Response           | What the command tells the person             |
| ------------------ | --------------------------------------------- |
| 2xx with url or id | Uploaded, here's your profile link            |
| 401, 403, or 410   | The code is invalid or expired, get a new one |
| Anything else      | Upload failed, nothing was saved              |

Codes must match `PP-` plus 4 letters or digits. The command uppercases whatever is pasted.

### Validating uploads

Use the shared package instead of writing checks by hand:

```ts
import { payloadSchema, scoreProfile } from "@pinky-promise/shared";

const payload = payloadSchema.parse(body.payload);
const { scores, confidence } = scoreProfile(payload.signals, payload.counts);
```

`payloadSchema` is strict, so any extra field (like text sneaking in) is rejected. Recomputing scores on the server means we never trust scores sent by the client, which is a good answer if judges ask about gaming it.

### One change to the agreed shape

A score can be `null`, with confidence `"none"`, when there's no evidence for it. Someone with git history but no Claude Code sessions has no Planning, Exploration, or Steering score. The profile page should show "not enough data" for those instead of a zero.

### Building the pages

Everything the profile and pair report pages show comes from `@pinky-promise/shared`:

| Page section            | Function                                                |
| ----------------------- | ------------------------------------------------------- |
| Archetype               | `profileArchetype(payload.scores)`                      |
| The co-founder you need | `cofounderYouNeed(payload).summary`                     |
| How to work with me     | `howToWorkWithMe(payload)`                              |
| Pair report             | `compareFounders({ name, payload }, { name, payload })` |
| Dimension labels        | `DIMENSION_LABELS`, `AREA_LABELS`                       |

`samplePayload` and `samplePartnerPayload` are two different builders, so the pair report page can be built before anyone uploads anything.

### Pointing the command at the API

Once the API is deployed, run the command with `--api <url>` or set `PINKY_PROMISE_API_URL`. Without either, it saves the payload to `pinky-promise-profile.json` instead of uploading. Send Shawnaya the deployed URL so it can become the default before publishing.

## Next for Zion

| Task | What                                                  | Needed by      |
| ---- | ----------------------------------------------------- | -------------- |
| M5   | Supabase project, keys shared through `.env`          | Tonight        |
| M6   | Claim `pinky-promise-cli` on npm                      | Tonight        |
| Z1   | Tables and security rules                             | Tue morning    |
| Z2   | `POST /upload-codes` and `POST /profiles`             | Tue 1 PM check |
| Z3   | Deploy, CI running `npm run typecheck` and `npm test` | Tue afternoon  |
| Z4   | Sign in, get upload code, profile page                | Tue 6 PM check |

Build `apps/api` and `apps/web` in their folders; both are already listed as workspaces.

## Next for Shawnaya

| Task    | What                                                                                           | When           |
| ------- | ---------------------------------------------------------------------------------------------- | -------------- |
| M3      | Run `npm run analyze -- --all --dry-run` on a personal laptop and check the profile reads true | Tonight        |
| A4      | Tune score cutoffs using both of our real profiles                                             | Tue morning    |
| B1      | Send the sample payload to the deployed API                                                    | Tue 1 PM       |
| B2      | Run the real command on both laptops                                                           | Tue 6 PM       |
| S8      | Wording and polish on the profile, pair report, and landing pages                              | Wed afternoon  |
| S9      | Score the business-founder challenge on the same dimensions                                    | Wed afternoon  |
| S10     | Final README pass with setup steps and diagram                                                 | Thu morning    |
| Stretch | Codex session parser; extra counts-only signals (P6)                                           | If time allows |

## Running it locally

```bash
npm install
npm run analyze -- --all --dry-run
npm test
npm run typecheck
npm run build
```

Run the analyzer only on personal machines and personal projects, never on employer code.
