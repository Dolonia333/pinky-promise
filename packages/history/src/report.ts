import {
  DIMENSIONS,
  DIMENSION_LABELS,
  TOPICS,
  TOPIC_LABELS,
  cofounderYouNeed,
  howToWorkWithMe,
  plural,
  profileArchetype,
  type Payload,
} from "@pinky-promise/shared";

const percent = (value: number) => `${Math.round(value * 100)}%`;

export function profileReport(payload: Payload): string[] {
  const archetype = profileArchetype(payload.scores);
  const topics = payload.signals.topics ?? {};
  const lines = [
    `Read ${plural(payload.counts.conversations ?? 0, "conversation")} from ${payload.window.from} to ${payload.window.to}`,
    "",
    `You're ${archetype.name}. ${archetype.tagline}`,
    "",
    ...DIMENSIONS.map((dimension) => {
      const score = payload.scores[dimension];
      const label = DIMENSION_LABELS[dimension].padEnd(13);
      return score === null
        ? `  ${label}not enough data`
        : `  ${label}${String(score).padStart(3)}  ${payload.confidence[dimension]}`;
    }),
    "",
    "Where your work goes",
    ...TOPICS.filter((topic) => topics[topic] !== undefined).map(
      (topic) => `  ${TOPIC_LABELS[topic].padEnd(13)}${percent(topics[topic] ?? 0)}`,
    ),
    "",
    "The co-founder you need",
    `  ${cofounderYouNeed(payload, undefined, "business").summary}`,
    "",
    "How to work with you",
    ...howToWorkWithMe(payload, "business").map((tip) => `  - ${tip}`),
  ];
  return lines;
}
