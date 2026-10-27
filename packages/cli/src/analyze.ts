import { homedir } from "node:os";
import { resolve } from "node:path";
import type { Options } from "./args";
import { collectEvidence, type Scope } from "./evidence";
import { localHighlights } from "./highlights";
import { buildPayload } from "./payload";
import { defaultClaudeDir } from "./sources/claude-code";
import * as terminal from "./terminal";
import { UPLOAD_CODE, UploadError, normalizeCode, saveProfile, uploadProfile } from "./upload";

const WINDOW_MONTHS = 12;

export function scopeFor(options: Options, now = new Date(), cwd = process.cwd()): Scope {
  const since = new Date(now);
  since.setMonth(since.getMonth() - WINDOW_MONTHS);
  return {
    root: resolve(cwd),
    project: options.project ? resolve(cwd, options.project) : null,
    all: options.all,
    claudeDir: defaultClaudeDir(),
    emails: options.emails,
    since,
    until: now,
  };
}

function describeScope(scope: Scope): string {
  const home = homedir();
  const shorten = (path: string) => (path.startsWith(home) ? `~${path.slice(home.length)}` : path);
  if (scope.project) return `Project ${shorten(scope.project)}`;
  if (scope.all) return `Everything on this machine, plus repos under ${shorten(scope.root)}`;
  return `Repos and sessions under ${shorten(scope.root)}`;
}

export async function analyze(options: Options, version: string): Promise<number> {
  const scope = scopeFor(options);
  if (!options.json) terminal.printIntro(version);

  const evidence = await collectEvidence(scope);
  if (evidence.repos.length === 0 && evidence.sessions.length === 0) {
    terminal.failure(
      "\nNo commits of yours or Claude Code sessions found here. Run it from your projects folder, " +
        "pass --project <path>, or use --email if you commit with a different address.",
    );
    return 1;
  }

  const payload = buildPayload(evidence, version);
  if (options.json) {
    console.log(JSON.stringify(payload, null, 2));
    return 0;
  }

  terminal.printFound(payload, describeScope(scope));
  terminal.printHighlights(localHighlights(evidence), payload);
  terminal.printProfile(payload);
  terminal.printPreview(payload);

  if (options.dryRun) {
    terminal.notice("\nDry run, so nothing was uploaded.");
    return 0;
  }

  const consent = await terminal.ask("\nType yes to upload these numbers: ");
  if (consent.toLowerCase() !== "yes") {
    terminal.notice("Nothing was uploaded.");
    return 0;
  }

  if (options.out || !options.apiUrl) {
    const path = resolve(options.out ?? "pinky-promise-profile.json");
    await saveProfile(path, payload);
    terminal.success(`Saved to ${path}`);
    return 0;
  }

  const code = normalizeCode(options.code ?? (await terminal.ask("Paste your upload code from the website: ")));
  if (!UPLOAD_CODE.test(code)) {
    terminal.failure("Upload codes look like PP-7F3K. Get one on the website and run this again.");
    return 1;
  }

  try {
    const url = await uploadProfile(options.apiUrl, code, payload);
    terminal.success(`Uploaded. Your profile: ${url}`);
    return 0;
  } catch (error) {
    if (error instanceof UploadError) {
      terminal.failure(error.message);
      return 1;
    }
    throw error;
  }
}
