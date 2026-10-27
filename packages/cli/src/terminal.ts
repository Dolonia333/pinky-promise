import { createInterface } from "node:readline/promises";
import {
  DIMENSIONS,
  DIMENSION_LABELS,
  cofounderYouNeed,
  formatHour,
  howToWorkWithMe,
  peakHour,
  plural,
  profileArchetype,
  type Payload,
} from "@pinky-promise/shared";
import pc from "picocolors";
import type { Highlights } from "./highlights";

const line = (text = "") => console.log(text);
const heading = (text: string) => line(`\n${pc.bold(text)}`);

export function printIntro(version: string): void {
  line(`${pc.bold(pc.magenta("Pinky Promise"))} ${pc.dim(`v${version}`)}`);
  line(pc.dim("Find out how you build before you pinky promise."));
  line();
  line(pc.yellow("Run this only on your own machine and your own projects, never on employer code or a work laptop."));
}

const TOOL_NAMES: Partial<Record<Payload["sources"][number], string>> = {
  claude_code: "Claude Code",
  codex: "Codex",
};

function toolNames(payload: Payload): string {
  const names = payload.sources.flatMap((source) => TOOL_NAMES[source] ?? []);
  return names.length > 0 ? ` (${names.join(" and ")})` : "";
}

export function printFound(payload: Payload, where: string): void {
  const { repos, commits, sessions } = payload.counts;
  line();
  line(
    `${pc.green("✔")} Read ${plural(repos, "repo")}, ${plural(commits, "commit")} of yours, ` +
      `and ${plural(sessions, "AI coding session")}${toolNames(payload)}`,
  );
  line(pc.dim(`  ${where}, ${payload.window.from} to ${payload.window.to}`));
}

export function printHighlights(highlights: Highlights, payload: Payload): void {
  const peak = peakHour(payload.signals.activeHours);
  const rows: Array<[string, string | null]> = [
    ["Busiest hour", peak === null ? null : formatHour(peak)],
    ["Busiest day", highlights.busiestWeekday],
    ["Longest streak", highlights.longestStreakDays > 1 ? `${highlights.longestStreakDays} days in a row` : null],
    [
      "Longest AI session",
      highlights.longestSessionMinutes === null ? null : `${highlights.longestSessionMinutes} minutes`,
    ],
    ["Time building with AI", highlights.hoursWithAi > 0 ? `about ${plural(highlights.hoursWithAi, "hour")}` : null],
  ];
  heading(`Just for you ${pc.dim("(never uploaded)")}`);
  for (const [label, value] of rows) if (value) line(`  ${label.padEnd(24)}${value}`);
}

function bar(score: number): string {
  const filled = Math.round(score / 10);
  return pc.magenta("█".repeat(filled)) + pc.dim("░".repeat(10 - filled));
}

export function printProfile(payload: Payload): void {
  const archetype = profileArchetype(payload.scores);
  heading(`You're ${archetype.name}. ${pc.dim(archetype.tagline)}`);
  for (const dimension of DIMENSIONS) {
    const score = payload.scores[dimension];
    const label = DIMENSION_LABELS[dimension].padEnd(13);
    if (score === null) line(`  ${label}${pc.dim("not enough data")}`);
    else line(`  ${label}${String(score).padStart(3)}  ${bar(score)}  ${pc.dim(payload.confidence[dimension])}`);
  }

  heading("The co-founder you need");
  line(`  ${cofounderYouNeed(payload).summary}`);

  const tips = howToWorkWithMe(payload);
  if (tips.length > 0) {
    heading("How to work with you");
    for (const tip of tips) line(`  • ${tip}`);
  }
}

export function compactJson(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(
    /\[\s+([^\[\]{}]*?)\s+\]/g,
    (_, items: string) => `[${items.replace(/,\s+/g, ", ")}]`,
  );
}

export function printPreview(payload: Payload): void {
  heading("Exactly what would be uploaded");
  line(pc.dim(compactJson(payload)));
  line();
  line("Nothing else leaves your machine: no code, prompts, file paths, commit messages, names, or emails.");
}

export const success = (text: string) => line(`${pc.green("✔")} ${text}`);
export const notice = (text: string) => line(pc.dim(text));
export const failure = (text: string) => console.error(pc.red(text));

export async function ask(question: string): Promise<string> {
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await prompt.question(question)).trim();
  } finally {
    prompt.close();
  }
}
