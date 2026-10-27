/**
 * Z9 — rough timings for analyzer-scale matching with 100 people.
 * Run: node scripts/bench-room.mjs
 */
import { matchRoom, simulatedCohort, topMatches, scoreFit } from "../apps/web/src/lib/pinky/cohort.ts";

function inflate(count) {
  const base = simulatedCohort();
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const seed = base[i % base.length];
    out.push({
      ...seed,
      id: `bench-${i}`,
      displayName: `${seed.displayName} ${i + 1}`,
    });
  }
  return out;
}

function time(label, fn) {
  const start = performance.now();
  const value = fn();
  const ms = performance.now() - start;
  return { label, ms, value };
}

const people = inflate(100);
const you = people[0];

const fit = time("scoreFit x 4950 edges", () => {
  let sum = 0;
  for (let i = 0; i < people.length; i += 1) {
    for (let j = i + 1; j < people.length; j += 1) sum += scoreFit(people[i], people[j]);
  }
  return sum;
});

const room = time("matchRoom 100", () => matchRoom(people));
const tops = time("topMatches 100 → 5", () => topMatches(you, people.slice(1), 5));

const lines = [
  `Pinky Promise bench (${new Date().toISOString().slice(0, 10)})`,
  `- ${fit.label}: ${fit.ms.toFixed(1)} ms`,
  `- ${room.label}: ${room.ms.toFixed(1)} ms (${room.value.pairs.length} pairs)`,
  `- ${tops.label}: ${tops.ms.toFixed(1)} ms`,
];

console.log(lines.join("\n"));
