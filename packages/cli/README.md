# pinky-promise-cli

**Find out before you pinky promise.**

One command reads your git history and Claude Code sessions on your own machine, scores how you build, and tells you what kind of co-founder would cover your gaps.

```bash
npx pinky-promise-cli analyze --dry-run
```

`--dry-run` shows everything and uploads nothing. Run it only on your own machine and your own projects, never on employer code or a work laptop.

## What leaves your machine

Only numbers, and only after you read them and type `yes`: counts, rates, and timings. Never code, prompts, file paths, repo names, commit messages, names, emails, or secrets.

## Options

```
--project <path>   Analyze one project only
--all              Include every Claude Code session on this machine
--dry-run          Show the preview and never upload
--json             Print only the payload as JSON
--email <email>    Count commits made with this email as yours (repeatable)
--code <code>      Upload code from the website, like PP-7F3K
--out <file>       Save the payload to a file instead of uploading
--api <url>        API address (or set PINKY_PROMISE_API_URL)
```

Source and privacy details: https://github.com/naya-ai/pinky-promise

## License

MIT
