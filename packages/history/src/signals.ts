import { TOPICS, activeHoursFrom, type ChatSignals, type Topic, type Topics } from "@pinky-promise/shared";
import type { Conversation, Turn } from "./conversation";
import { intentsOf, topicsOf, type Intent } from "./intent";

interface ReadTurn {
  turn: Turn;
  intents: Set<Intent>;
}

interface ReadConversation {
  conversation: Conversation;
  turns: ReadTurn[];
}

const roundRate = (value: number) => Math.round(value * 100) / 100;
const roundOne = (value: number) => Math.round(value * 10) / 10;

function rate<T>(items: T[], test: (item: T) => boolean): number | null {
  return items.length === 0 ? null : roundRate(items.filter(test).length / items.length);
}

function localDate(time: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}`;
}

function read(conversation: Conversation): ReadConversation {
  return {
    conversation,
    turns: conversation.turns.map((turn) => ({
      turn,
      intents: turn.role === "user" ? intentsOf(turn.text) : new Set<Intent>(),
    })),
  };
}

const userTurns = (item: ReadConversation) => item.turns.filter(({ turn }) => turn.role === "user");
const firstIndex = (item: ReadConversation, test: (turn: ReadTurn) => boolean) => item.turns.findIndex(test);
const firstDraft = (item: ReadConversation) => firstIndex(item, ({ intents }) => intents.has("draft"));

function plannedFirst(item: ReadConversation): boolean {
  const plan = firstIndex(item, ({ intents }) => intents.has("plan"));
  return plan !== -1 && plan <= firstDraft(item);
}

function researchedFirst(item: ReadConversation): boolean {
  const research = firstIndex(item, ({ turn, intents }) => intents.has("research") || turn.tool === "search");
  return research !== -1 && research <= firstDraft(item);
}

function verified(item: ReadConversation): boolean {
  return item.turns.some(({ intents }) => intents.has("verify"));
}

export function withinWindow(conversations: Conversation[], since: Date, until: Date): Conversation[] {
  return conversations.filter(
    (conversation) =>
      conversation.created >= since &&
      conversation.created <= until &&
      conversation.turns.some((turn) => turn.role === "user"),
  );
}

export function chatSignals(conversations: Conversation[]): ChatSignals {
  const items = conversations.map(read);
  const drafting = items.filter((item) => firstDraft(item) !== -1);
  const multiTurn = items.filter((item) => userTurns(item).length >= 2);
  const users = items.flatMap(userTurns);
  const pushback =
    users.filter(({ intents }) => intents.has("pushback")).length +
    users.filter(({ turn }) => turn.edited).length +
    items.flatMap((item) => item.turns).filter(({ turn }) => turn.regenerated).length;
  const days = new Set(conversations.map((conversation) => localDate(conversation.created)));

  return {
    conversations: conversations.length,
    planFirstRate: rate(drafting, plannedFirst),
    researchFirstRate: rate(drafting, researchedFirst),
    verifyRate: rate(multiTurn, verified),
    pushbackRate: users.length === 0 ? null : roundRate(Math.min(1, pushback / users.length)),
    revisionsPerConversation:
      drafting.length === 0
        ? null
        : roundOne(drafting.reduce((sum, item) => sum + userTurns(item).length - 1, 0) / drafting.length),
    conversationsPerActiveDay: days.size === 0 ? null : roundOne(conversations.length / days.size),
  };
}

export function topicShares(conversations: Conversation[]): Topics {
  const counts = new Map<Topic, number>();
  for (const conversation of conversations) {
    const text = conversation.turns
      .filter((turn) => turn.role === "user")
      .map((turn) => turn.text)
      .join("\n");
    for (const topic of topicsOf(text)) counts.set(topic, (counts.get(topic) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((sum, value) => sum + value, 0);
  if (total === 0) return {};
  return Object.fromEntries(
    TOPICS.filter((topic) => counts.has(topic)).map((topic) => [topic, roundRate(counts.get(topic)! / total)]),
  );
}

export function promptTimes(conversations: Conversation[]): Date[] {
  return conversations.flatMap((conversation) =>
    conversation.turns.filter((turn) => turn.role === "user" && turn.time).map((turn) => turn.time as Date),
  );
}

export function historyActiveHours(conversations: Conversation[]): number[] {
  return activeHoursFrom(promptTimes(conversations));
}
