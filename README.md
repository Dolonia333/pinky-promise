# Pinky Promise

**Find out before you pinky promise.**

Co-founder conflict is one of the most common reasons startups fail, and people still pick co-founders from self-written profiles and coffee chats. Meanwhile, most technical founders now build with AI coding tools, and those tools quietly record how they really work.

Pinky Promise is one command. It reads your git history and AI coding sessions **on your own machine**, turns what you actually did into a builder profile, and tells you what kind of co-founder would cover your gaps. Share it with a possible co-founder and you both get a report on where you complement each other and where you'll clash.

Built at the AITX & MLOps World Community Hackathon, Austin Tech Week 2026, by Shawnaya Williams and Zion Van Zandt.

## Try it

```bash
npx pinky-promise-cli analyze --dry-run
```

Until the package is published, run it from source:

```bash
git clone https://github.com/naya-ai/pinky-promise.git
cd pinky-promise
npm install
npm run analyze -- --all --dry-run
```

`--dry-run` shows everything and uploads nothing. Run it only on your own machine and your own projects, never on employer code or a work laptop.

## What leaves your machine

Only numbers, and only after you read them and type `yes`.

| Read locally                                 | Sent after you approve                                                                                   |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `git log --numstat`, your commits, 12 months | Commit count, median commit size, commits per active day, share of commits touching tests                |
| Claude Code sessions in `~/.claude/projects` | Rates for tests run, failures fixed, reading before editing, planning before code, pushback on the agent |
| File paths, to tell frontend from backend    | Share of your work per area (frontend, backend, infra, data)                                             |
| Timestamps                                   | Activity by hour of day, scaled 0 to 9                                                                   |
| Shared repos                                 | How you split work with teammates, as rates, never who they are                                          |

**Never sent:** code, prompts, file paths, repo names, commit messages, names, emails, or anything shaped like a secret.

This is enforced in code, not just promised:

- The payload schema is strict and accepts only counts, rates, dates, and known labels ([`packages/shared/src/payload.ts`](packages/shared/src/payload.ts)).
- Before upload, the command walks the payload and refuses any free text ([`packages/cli/src/payload.ts`](packages/cli/src/payload.ts)).
- A test plants fake API keys, emails, file paths, and project names in a repo and a session, runs the whole analyzer, and checks that none of them come out ([`packages/cli/test/privacy.test.ts`](packages/cli/test/privacy.test.ts)).

## How it scores

Five dimensions, each 0 to 100, computed in plain code from what you did, not what you wrote. No AI model decides a score.

| Dimension   | Based on                                                                |
| ----------- | ----------------------------------------------------------------------- |
| Planning    | Planning steps or plan mode before the first edit in a session          |
| Quality     | Test runs per session, failing tests that get fixed, commits with tests |
| Pace        | Commits per active day and commit size                                  |
| Exploration | Reading and searching the code before changing it                       |
| Steering    | Rejecting or interrupting the agent when it goes off track              |

Every score carries a confidence label (strong, medium, weak) based on how many sessions and commits back it. The rubric lives in [`packages/shared/src/scoring.ts`](packages/shared/src/scoring.ts), with tests.

From the scores, the analyzer gives you an archetype (like The Blueprint or The Rocket), "the co-founder you need," and tips on how to work with you. Two profiles produce a pair report: where you complement each other, where friction is likely, and a suggested next step ([`packages/shared/src/compatibility.ts`](packages/shared/src/compatibility.ts)).

## Options

```
pinky-promise-cli analyze [options]

  --project <path>   Analyze one project only
  --all              Include every Claude Code session on this machine
  --dry-run          Show the preview and never upload
  --json             Print only the payload as JSON
  --email <email>    Count commits made with this email as yours (repeatable)
  --code <code>      Upload code from the website, like PP-7F3K
  --out <file>       Save the payload to a file instead of uploading
  --api <url>        API address (or set PINKY_PROMISE_API_URL)
```

## Project layout

```
packages/cli       The analyze command: git and Claude Code readers, signals, preview, upload
packages/shared    Payload contract, scoring rubric, archetypes, profile and pair report text
apps/api           API for upload codes, profiles, and pair reports
apps/web           Web app for profiles, invites, and pair reports
```

## Development

```bash
npm install
npm test            # unit and end-to-end tests
npm run typecheck
npm run build       # bundles the command into packages/cli/dist
```

`packages/shared/sample-payload.json` is a sample upload for building the API and web app without running the analyzer.

## License

MIT
