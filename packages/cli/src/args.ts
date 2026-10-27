import { parseArgs } from "node:util";

export interface Options {
  command: "analyze" | "help" | "version";
  project: string | null;
  all: boolean;
  dryRun: boolean;
  json: boolean;
  apiUrl: string | null;
  code: string | null;
  out: string | null;
  emails: string[];
}

export const USAGE = `Usage: pinky-promise-cli analyze [options]

Reads your git history and Claude Code sessions on this machine, scores how you
build, and shows exactly what would be uploaded before anything leaves.

Options
  --project <path>   Analyze one project only
  --all              Include every Claude Code session on this machine
  --dry-run          Show the preview and never upload
  --json             Print only the payload as JSON
  --email <email>    Count commits made with this email as yours (repeatable)
  --code <code>      Upload code from the website, like PP-7F3K
  --out <file>       Save the payload to a file instead of uploading
  --api <url>        API address (or set PINKY_PROMISE_API_URL)
  -h, --help         Show this help
  -v, --version      Show the version`;

export function parseOptions(argv: string[], env: NodeJS.ProcessEnv = process.env): Options {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      project: { type: "string" },
      all: { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
      json: { type: "boolean", default: false },
      email: { type: "string", multiple: true, default: [] },
      code: { type: "string" },
      out: { type: "string" },
      api: { type: "string" },
      help: { type: "boolean", short: "h", default: false },
      version: { type: "boolean", short: "v", default: false },
    },
  });

  const [command = "analyze"] = positionals;
  if (command !== "analyze" && command !== "help") throw new Error(`Unknown command "${command}".\n\n${USAGE}`);

  return {
    command: values.help || command === "help" ? "help" : values.version ? "version" : "analyze",
    project: values.project ?? null,
    all: values.all,
    dryRun: values["dry-run"],
    json: values.json,
    apiUrl: values.api ?? env.PINKY_PROMISE_API_URL ?? null,
    code: values.code ?? null,
    out: values.out ?? null,
    emails: values.email,
  };
}
