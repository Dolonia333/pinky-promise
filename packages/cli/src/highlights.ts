import type { Evidence } from "./evidence";
import { localDate, ownCommits } from "./signals";

export interface Highlights {
  busiestWeekday: string | null;
  longestSessionMinutes: number | null;
  hoursWithAi: number;
  longestStreakDays: number;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_MS = 24 * 60 * 60 * 1000;

function longestStreak(days: string[]): number {
  const sorted = [...new Set(days)].map((day) => new Date(`${day}T12:00:00`).getTime()).sort((a, b) => a - b);
  let best = 0;
  let current = 0;
  sorted.forEach((day, index) => {
    current = index > 0 && Math.round((day - sorted[index - 1]) / DAY_MS) === 1 ? current + 1 : 1;
    best = Math.max(best, current);
  });
  return best;
}

export function localHighlights(evidence: Evidence): Highlights {
  const times = [...ownCommits(evidence).map((commit) => commit.time), ...evidence.sessions.flatMap((s) => s.prompts)];
  const weekdayCounts = Array<number>(7).fill(0);
  for (const time of times) weekdayCounts[time.getDay()] += 1;
  const busiest = Math.max(...weekdayCounts);

  const minutes = evidence.sessions.map((session) => (session.end.getTime() - session.start.getTime()) / 60000);
  return {
    busiestWeekday: busiest === 0 ? null : WEEKDAYS[weekdayCounts.indexOf(busiest)],
    longestSessionMinutes: minutes.length === 0 ? null : Math.round(Math.max(...minutes)),
    hoursWithAi: Math.round(minutes.reduce((sum, value) => sum + Math.min(value, 240), 0) / 60),
    longestStreakDays: longestStreak(times.map(localDate)),
  };
}
