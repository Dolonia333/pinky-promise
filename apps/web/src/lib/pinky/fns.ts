import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { matchRoom, simulatedCohort, topMatches } from "./cohort.ts";
import { isSection } from "./challenge.ts";
import {
  acceptShare,
  activeCode,
  combinedProfile,
  compareWithMaya,
  createShare,
  finishChallenge,
  issueCode,
  listReports,
  loadSample,
  logChallenge,
  peekShare,
  publicProfile,
  readChallenge,
  readReport,
  redeemCode,
  removeMine,
  saveFeedback,
  setRating,
  startChallenge,
} from "./store.server.ts";

export const getStudio = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await combinedProfile(context.userId);
    const code = await activeCode(context.userId);
    return {
      profile: profile ? publicProfile(profile) : null,
      code,
      reports: await listReports(context.userId),
    };
  });

export const issueUploadCode = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => issueCode(context.userId));

export const useSampleProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => loadSample(context.userId));

export const pastePayload = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { code: string; json: string }) => input)
  .handler(async ({ data }) => {
    let body: unknown;
    try {
      body = JSON.parse(data.json);
    } catch {
      return { ok: false as const, status: 400, error: "That isn't JSON." };
    }
    return redeemCode(data.code, body);
  });

export const rateProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((rating: number) => {
    const n = Math.round(rating);
    if (n < 1 || n > 5) throw new Error("Pick a number from 1 to 5.");
    return n;
  })
  .handler(async ({ context, data }) => {
    await setRating(context.userId, data);
    return { ok: true };
  });

export const openMaya = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => compareWithMaya(context.userId));

export const makeInvite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => createShare(context.userId));

export const previewInvite = createServerFn({ method: "GET" })
  .validator((token: string) => token.trim())
  .handler(async ({ data }) => peekShare(data));

export const takeInvite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((token: string) => token.trim())
  .handler(async ({ context, data }) => acceptShare(data, context.userId));

export const getReport = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data }) => readReport(data, context.userId));

export const beginChallenge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => startChallenge(context.userId));

export const getChallenge = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data }) => readChallenge(context.userId, data));

const actionSchema = z.discriminatedUnion("type", [
  z.object({
    sessionId: z.string().min(8),
    type: z.literal("add"),
    section: z.string().refine(isSection),
    text: z.string().trim().min(1).max(280),
  }),
  z.object({
    sessionId: z.string().min(8),
    type: z.literal("edit"),
    cardId: z.string().min(8),
    text: z.string().trim().min(1).max(280),
  }),
  z.object({
    sessionId: z.string().min(8),
    type: z.literal("comment"),
    cardId: z.string().min(8),
    text: z.string().trim().min(1).max(280),
  }),
  z.object({
    sessionId: z.string().min(8),
    type: z.literal("vote"),
    cardId: z.string().min(8),
  }),
  z.object({
    sessionId: z.string().min(8),
    type: z.literal("lock"),
    section: z.string().refine(isSection),
  }),
]);

export const actOnChallenge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const parsed = actionSchema.safeParse(input);
    if (!parsed.success) throw new Error("That action doesn't fit the board.");
    return parsed.data;
  })
  .handler(async ({ context, data }) => {
    const { sessionId, ...action } = data;
    return logChallenge(context.userId, sessionId, action);
  });

export const closeChallenge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data }) => finishChallenge(context.userId, data));

export const getRoom = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const mine = await combinedProfile(context.userId);
    const people = simulatedCohort();
    const withYou = mine
      ? [
          ...people,
          {
            ...mine,
            id: "you",
            domain: "Your call",
            goals: "full-time" as const,
            displayName: mine.displayName || "You",
          },
        ]
      : people;
    return {
      profile: mine ? publicProfile(mine) : null,
      matches: mine ? topMatches(mine, people, 3) : [],
      round: matchRoom(withYou),
      roomSize: withYou.length,
    };
  });

export const deleteMyData = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await removeMine(context.userId);
    return { ok: true };
  });

export const sendFeedback = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { page: string; body: string }) => {
    const body = input.body?.trim() ?? "";
    if (body.length < 2) throw new Error("Write a sentence.");
    return { page: (input.page || "app").slice(0, 80), body: body.slice(0, 2000) };
  })
  .handler(async ({ context, data }) => {
    await saveFeedback(context.userId, data.page, data.body);
    return { ok: true };
  });
