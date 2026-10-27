import { scoreProfile } from "@pinky-promise/shared";
import { getSql } from "@/lib/db";
import { boardFromEvents, challengePayload, CHALLENGES, renderBrief, type BoardEvent } from "./challenge.ts";
import { archetypeOf, cofounderNeed, evidenceLines, mergeProfiles, pairReport, workWithMe } from "./fit.ts";
import { payloadSchema, type AnalyzerPayload } from "./payload.ts";
import { MAYA_ID, SAMPLE_PAYLOAD, mayaProfile } from "./sample.ts";
import type { Background, Confidence, ProfileInput, ScoreKey, Scores, Signals } from "./types.ts";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function json<T>(value: unknown, fallback: T): T {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  if (value == null) return fallback;
  return value as T;
}

function stamp(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function newId(): string {
  return crypto.randomUUID();
}

export function makeUploadCode(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  let code = "PP-";
  for (const byte of bytes) code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return code;
}

type ProfileRow = {
  id: string;
  user_id: string;
  analyzer_version: string;
  sources: unknown;
  window_from: string | null;
  window_to: string | null;
  counts: unknown;
  signals: unknown;
  scores: unknown;
  confidence: unknown;
  background: string;
  display_name: string;
  demo: boolean;
  rating: number | null;
  created_at: unknown;
};

function rowToProfile(row: ProfileRow): ProfileInput {
  const background: Background =
    row.background === "business" || row.background === "both" ? row.background : "technical";
  return {
    id: row.id,
    displayName: row.display_name || "Founder",
    background,
    demo: Boolean(row.demo),
    sources: json<string[]>(row.sources, []),
    window: row.window_from && row.window_to ? { from: row.window_from, to: row.window_to } : null,
    counts: json(row.counts, { repos: 0, commits: 0, sessions: 0 }),
    signals: json<Signals>(row.signals, SAMPLE_PAYLOAD.signals),
    scores: json<Scores>(row.scores, SAMPLE_PAYLOAD.scores),
    confidence: json<Record<ScoreKey, Confidence>>(row.confidence, SAMPLE_PAYLOAD.confidence),
    rating: row.rating == null ? null : Number(row.rating),
    createdAt: stamp(row.created_at),
    uploadCount: 1,
  };
}

async function displayName(userId: string): Promise<string> {
  const sql = await getSql();
  const rows = await sql.query<{ name: string | null; email: string | null }>(
    `select name, email from "user" where id = $1`,
    [userId],
  );
  const row = rows[0];
  const name = row?.name?.trim();
  if (name) return name;
  const email = row?.email ?? "";
  const local = email.split("@")[0];
  return local || "Founder";
}

export async function combinedProfile(userId: string): Promise<ProfileInput | null> {
  const sql = await getSql();
  const rows = await sql.query<ProfileRow>(
    `select id, user_id, analyzer_version, sources, window_from, window_to, counts, signals, scores, confidence, background, display_name, demo, rating, created_at
     from builder_profiles where user_id = $1 order by created_at asc`,
    [userId],
  );
  return mergeProfiles(rows.map(rowToProfile));
}

async function insertPayload(
  userId: string,
  payload: AnalyzerPayload,
  background: Background,
  demo: boolean,
): Promise<string> {
  const sql = await getSql();
  const id = newId();
  const name = await displayName(userId);
  await sql.query(
    `insert into builder_profiles (
      id, user_id, analyzer_version, sources, window_from, window_to, counts, signals, scores, confidence, background, display_name, demo
    ) values (
      $1, $2, $3, $4::jsonb, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb, $11, $12, $13
    )`,
    [
      id,
      userId,
      payload.analyzerVersion,
      JSON.stringify(payload.sources),
      payload.window.from,
      payload.window.to,
      JSON.stringify(payload.counts),
      JSON.stringify(payload.signals),
      JSON.stringify(payload.scores),
      JSON.stringify(payload.confidence),
      background,
      name,
      demo,
    ],
  );
  return id;
}

export async function issueCode(userId: string): Promise<{ code: string; expiresAt: string }> {
  const sql = await getSql();
  const existing = await sql.query<{ code: string; expires_at: unknown }>(
    `select code, expires_at from upload_codes
     where user_id = $1 and used_at is null and expires_at > now()
     order by created_at desc limit 1`,
    [userId],
  );
  if (existing[0]) return { code: existing[0].code, expiresAt: stamp(existing[0].expires_at) };
  const code = makeUploadCode();
  const rows = await sql.query<{ expires_at: unknown }>(
    `insert into upload_codes (code, user_id, expires_at) values ($1, $2, now() + interval '15 minutes') returning expires_at`,
    [code, userId],
  );
  return { code, expiresAt: stamp(rows[0]?.expires_at) };
}

export async function activeCode(userId: string): Promise<{ code: string; expiresAt: string } | null> {
  const sql = await getSql();
  const rows = await sql.query<{ code: string; expires_at: unknown }>(
    `select code, expires_at from upload_codes
     where user_id = $1 and used_at is null and expires_at > now()
     order by created_at desc limit 1`,
    [userId],
  );
  if (!rows[0]) return null;
  return { code: rows[0].code, expiresAt: stamp(rows[0].expires_at) };
}

export async function redeemCode(
  code: string,
  body: unknown,
  background: Background = "technical",
): Promise<{ ok: true; profileId: string; path: string } | { ok: false; status: number; error: string }> {
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) return { ok: false, status: 400, error: "Payload doesn't match the agreed shape." };
  if (parsed.data.sources.includes("challenge")) {
    return { ok: false, status: 400, error: "Challenge profiles can only come from the challenge." };
  }
  const payload: AnalyzerPayload = {
    ...parsed.data,
    ...scoreProfile(parsed.data.signals, parsed.data.counts),
  };

  const normalized = code.trim().toUpperCase();
  const sql = await getSql();
  const claimed = await sql.query<{ user_id: string }>(
    `update upload_codes set used_at = now()
     where code = $1 and used_at is null and expires_at > now()
     returning user_id`,
    [normalized],
  );
  const owner = claimed[0];
  if (!owner) {
    const rows = await sql.query<{ used_at: unknown }>(`select used_at from upload_codes where code = $1`, [
      normalized,
    ]);
    if (!rows[0]) return { ok: false, status: 401, error: "That code doesn't exist." };
    if (rows[0].used_at) return { ok: false, status: 401, error: "That code was already used." };
    return { ok: false, status: 401, error: "That code expired. Get a new one." };
  }

  const profileId = await insertPayload(owner.user_id, payload, background, false);
  return { ok: true, profileId, path: "/profile" };
}

export async function loadSample(userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const sql = await getSql();
  const real = await sql.query<{ id: string }>(
    `select id from builder_profiles where user_id = $1 and demo = false limit 1`,
    [userId],
  );
  if (real[0]) return { ok: false, error: "You already have a real profile. The sample is only for practice." };
  await sql.query(`delete from builder_profiles where user_id = $1 and demo = true`, [userId]);
  await insertPayload(userId, SAMPLE_PAYLOAD, "technical", true);
  return { ok: true };
}

export async function setRating(userId: string, rating: number): Promise<void> {
  const profile = await combinedProfile(userId);
  if (!profile) return;
  const sql = await getSql();
  await sql.query(`update builder_profiles set rating = $1 where id = $2 and user_id = $3`, [
    rating,
    profile.id,
    userId,
  ]);
}

export type ReportView = {
  id: string;
  nameA: string;
  nameB: string;
  headline: string;
  archetype: string;
  archetypeLine: string;
  complements: string[];
  frictions: string[];
  nextStep: string;
  numbers: { label: string; value: string }[];
  confidenceNote: string;
  createdAt: string;
  youAre: "a" | "b";
};

type ReportRow = {
  id: string;
  user_a: string;
  user_b: string;
  name_a: string;
  name_b: string;
  headline: string;
  archetype: string;
  archetype_line: string;
  complements: unknown;
  frictions: unknown;
  next_step: string;
  numbers: unknown;
  confidence_note: string;
  created_at: unknown;
};

function rowToReport(row: ReportRow, userId: string): ReportView {
  return {
    id: row.id,
    nameA: row.name_a,
    nameB: row.name_b,
    headline: row.headline,
    archetype: row.archetype,
    archetypeLine: row.archetype_line,
    complements: json<string[]>(row.complements, []),
    frictions: json<string[]>(row.frictions, []),
    nextStep: row.next_step,
    numbers: json<{ label: string; value: string }[]>(row.numbers, []),
    confidenceNote: row.confidence_note,
    createdAt: stamp(row.created_at),
    youAre: row.user_a === userId ? "a" : "b",
  };
}

async function saveReport(userA: string, userB: string, a: ProfileInput, b: ProfileInput): Promise<string> {
  const report = pairReport(a, b);
  const sql = await getSql();
  const id = newId();
  await sql.query(
    `insert into pair_reports (
      id, user_a, user_b, name_a, name_b, headline, archetype, archetype_line, complements, frictions, next_step, numbers, confidence_note
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11,$12::jsonb,$13)`,
    [
      id,
      userA,
      userB,
      a.displayName,
      b.displayName,
      report.headline,
      report.archetype.name,
      report.archetype.line,
      JSON.stringify(report.complements),
      JSON.stringify(report.frictions),
      report.nextStep,
      JSON.stringify(report.numbers),
      report.confidenceNote,
    ],
  );
  return id;
}

export async function compareWithMaya(
  userId: string,
): Promise<{ ok: true; reportId: string } | { ok: false; error: string }> {
  const mine = await combinedProfile(userId);
  if (!mine) return { ok: false, error: "Build a profile first." };
  const sql = await getSql();
  const existing = await sql.query<{ id: string }>(
    `select id from pair_reports where user_a = $1 and user_b = $2 order by created_at desc limit 1`,
    [userId, MAYA_ID],
  );
  if (existing[0] && mine.demo) return { ok: true, reportId: existing[0].id };
  const reportId = await saveReport(userId, MAYA_ID, { ...mine, displayName: mine.displayName }, mayaProfile());
  return { ok: true, reportId };
}

export async function createShare(userId: string): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const mine = await combinedProfile(userId);
  if (!mine) return { ok: false, error: "Build a profile first." };
  const sql = await getSql();
  const token = newId().replace(/-/g, "").slice(0, 12);
  await sql.query(
    `insert into share_links (token, owner_user_id, profile_id, expires_at) values ($1, $2, $3, now() + interval '7 days')`,
    [token, userId, mine.id],
  );
  return { ok: true, token };
}

export async function peekShare(
  token: string,
): Promise<
  { ok: true; name: string; archetype: string; expired: boolean; used: boolean } | { ok: false; error: string }
> {
  const sql = await getSql();
  const rows = await sql.query<{
    owner_user_id: string;
    profile_id: string;
    expires_at: unknown;
    used_by: string | null;
  }>(`select owner_user_id, profile_id, expires_at, used_by from share_links where token = $1`, [token]);
  const link = rows[0];
  if (!link) return { ok: false, error: "This invite doesn't exist." };
  const owner = await combinedProfile(link.owner_user_id);
  if (!owner) return { ok: false, error: "That profile is gone." };
  return {
    ok: true,
    name: owner.displayName,
    archetype: archetypeOf(owner.scores).name,
    expired: new Date(stamp(link.expires_at)).getTime() < Date.now(),
    used: Boolean(link.used_by),
  };
}

export async function acceptShare(
  token: string,
  userId: string,
): Promise<{ ok: true; reportId: string } | { ok: false; error: string; needProfile?: boolean }> {
  const sql = await getSql();
  const rows = await sql.query<{
    owner_user_id: string;
    expires_at: unknown;
    used_by: string | null;
    report_id: string | null;
  }>(`select owner_user_id, expires_at, used_by, report_id from share_links where token = $1`, [token]);
  const link = rows[0];
  if (!link) return { ok: false, error: "This invite doesn't exist." };
  if (link.owner_user_id === userId) return { ok: false, error: "That's your own invite." };
  if (new Date(stamp(link.expires_at)).getTime() < Date.now()) return { ok: false, error: "This invite expired." };
  if (link.used_by && link.used_by !== userId) return { ok: false, error: "Someone already used this invite." };
  if (link.report_id && link.used_by === userId) return { ok: true, reportId: link.report_id };
  const mine = await combinedProfile(userId);
  if (!mine) return { ok: false, error: "You need a profile before the report can exist.", needProfile: true };
  const owner = await combinedProfile(link.owner_user_id);
  if (!owner) return { ok: false, error: "That profile is gone." };
  const reportId = await saveReport(link.owner_user_id, userId, owner, mine);
  await sql.query(`update share_links set used_by = $1, report_id = $2 where token = $3`, [userId, reportId, token]);
  return { ok: true, reportId };
}

export async function readReport(id: string, userId: string): Promise<ReportView | null> {
  const sql = await getSql();
  const rows = await sql.query<ReportRow>(
    `select id, user_a, user_b, name_a, name_b, headline, archetype, archetype_line, complements, frictions, next_step, numbers, confidence_note, created_at
     from pair_reports where id = $1 and (user_a = $2 or user_b = $2)`,
    [id, userId],
  );
  return rows[0] ? rowToReport(rows[0], userId) : null;
}

export async function listReports(userId: string): Promise<{ id: string; otherName: string; headline: string }[]> {
  const sql = await getSql();
  const rows = await sql.query<ReportRow>(
    `select id, user_a, user_b, name_a, name_b, headline, archetype, archetype_line, complements, frictions, next_step, numbers, confidence_note, created_at
     from pair_reports where user_a = $1 or user_b = $1 order by created_at desc limit 20`,
    [userId],
  );
  return rows.map((row) => ({
    id: row.id,
    otherName: row.user_a === userId ? row.name_b : row.name_a,
    headline: row.headline,
  }));
}

export async function startChallenge(userId: string): Promise<{ id: string }> {
  const sql = await getSql();
  const open = await sql.query<{ id: string }>(
    `select id from challenge_sessions where user_id = $1 and status = 'open' order by started_at desc limit 1`,
    [userId],
  );
  if (open[0]) return { id: open[0].id };
  const template = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)] ?? CHALLENGES[0];
  const seed = newId();
  const rendered = renderBrief(template, seed);
  const id = newId();
  await sql.query(
    `insert into challenge_sessions (id, user_id, domain, title, brief, seed) values ($1,$2,$3,$4,$5,$6)`,
    [id, userId, template.domain, template.title, rendered.brief, seed],
  );
  return { id };
}

export async function readChallenge(userId: string, id: string) {
  const sql = await getSql();
  const sessions = await sql.query<{
    id: string;
    domain: string;
    title: string;
    brief: string;
    status: string;
    started_at: unknown;
    ended_at: unknown;
    profile_id: string | null;
  }>(
    `select id, domain, title, brief, status, started_at, ended_at, profile_id from challenge_sessions where id = $1 and user_id = $2`,
    [id, userId],
  );
  const session = sessions[0];
  if (!session) return null;
  const events = await sql.query<{
    type: string;
    section: string | null;
    card_id: string | null;
    payload: unknown;
    created_at: unknown;
  }>(
    `select type, section, card_id, payload, created_at from challenge_events where session_id = $1 order by created_at asc, id asc`,
    [id],
  );
  const boardEvents: BoardEvent[] = events.map((event) => ({
    type: event.type,
    section: event.section,
    cardId: event.card_id,
    payload: json(event.payload, {}),
    createdAt: stamp(event.created_at),
  }));
  const board = boardFromEvents(boardEvents);
  const startedAt = stamp(session.started_at);
  return {
    id: session.id,
    domain: session.domain,
    title: session.title,
    brief: session.brief,
    status: session.status,
    startedAt,
    endsAt: new Date(new Date(startedAt).getTime() + 15 * 60 * 1000).toISOString(),
    profileId: session.profile_id,
    cards: board.cards,
    locks: board.locks,
    counts: { adds: board.adds, edits: board.edits, votes: board.votes },
  };
}

export async function logChallenge(
  userId: string,
  sessionId: string,
  action: { type: "add" | "edit" | "comment" | "vote" | "lock"; section?: string; cardId?: string; text?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const current = await readChallenge(userId, sessionId);
  if (!current) return { ok: false, error: "That challenge isn't yours." };
  if (current.status !== "open") return { ok: false, error: "This challenge is already closed." };
  if (current.counts.adds >= 20 && action.type === "add") return { ok: false, error: "That's enough cards." };
  if (current.counts.edits >= 24 && action.type === "edit") return { ok: false, error: "That's enough edits." };
  if (action.type === "lock" && action.section) {
    if (!current.cards.some((card) => card.section === action.section)) {
      return { ok: false, error: "Put a card in that section before you lock it." };
    }
    if (current.locks.includes(action.section as never)) return { ok: false, error: "Already locked." };
  }
  if ((action.type === "edit" || action.type === "comment" || action.type === "vote") && action.cardId) {
    const card = current.cards.find((item) => item.id === action.cardId);
    if (!card) return { ok: false, error: "That card is gone." };
    if (action.type === "vote" && card.votes >= 3) return { ok: false, error: "That card has enough votes." };
    if (current.locks.includes(card.section) && action.type !== "comment") {
      return { ok: false, error: "That section is locked." };
    }
  }
  if (action.type === "add" && action.section && current.locks.includes(action.section as never)) {
    return { ok: false, error: "That section is locked." };
  }
  const sql = await getSql();
  await sql.query(
    `insert into challenge_events (id, session_id, user_id, type, section, card_id, payload) values ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
    [
      newId(),
      sessionId,
      userId,
      action.type,
      action.section ?? null,
      action.type === "add" ? newId() : (action.cardId ?? null),
      JSON.stringify({ text: action.text ?? "" }),
    ],
  );
  return { ok: true };
}

export async function finishChallenge(
  userId: string,
  sessionId: string,
): Promise<{ ok: true; profileId: string } | { ok: false; error: string }> {
  const current = await readChallenge(userId, sessionId);
  if (!current) return { ok: false, error: "That challenge isn't yours." };
  if (current.profileId) return { ok: true, profileId: current.profileId };
  const touched = new Set(current.cards.map((card) => card.section));
  if (touched.size < 3) return { ok: false, error: "Put a card in at least three sections before you finish." };
  const endedAt = new Date().toISOString();
  const payload = challengePayload(
    {
      cards: current.cards,
      locks: current.locks,
      adds: current.counts.adds,
      edits: current.counts.edits,
      votes: current.counts.votes,
    },
    current.startedAt,
    endedAt,
  );
  const profileId = await insertPayload(userId, payload, "business", false);
  const sql = await getSql();
  await sql.query(
    `update challenge_sessions set status = 'finished', ended_at = now(), profile_id = $1 where id = $2 and user_id = $3`,
    [profileId, sessionId, userId],
  );
  return { ok: true, profileId };
}

export async function removeMine(userId: string): Promise<void> {
  const sql = await getSql();
  await sql.query(
    `delete from challenge_events where session_id in (select id from challenge_sessions where user_id = $1)`,
    [userId],
  );
  await sql.query(`delete from challenge_sessions where user_id = $1`, [userId]);
  await sql.query(`delete from pair_reports where user_a = $1 or user_b = $1`, [userId]);
  await sql.query(`delete from share_links where owner_user_id = $1 or used_by = $1`, [userId]);
  await sql.query(`delete from upload_codes where user_id = $1`, [userId]);
  await sql.query(`delete from builder_profiles where user_id = $1`, [userId]);
  await sql.query(`delete from app_feedback where user_id = $1`, [userId]);
}

export async function saveFeedback(userId: string, page: string, body: string): Promise<void> {
  const sql = await getSql();
  await sql.query(`insert into app_feedback (id, user_id, page, body) values ($1,$2,$3,$4)`, [
    newId(),
    userId,
    page.slice(0, 80),
    body.slice(0, 2000),
  ]);
}

export function publicProfile(profile: ProfileInput) {
  return {
    ...profile,
    archetype: archetypeOf(profile.scores),
    cofounderNeed: cofounderNeed(profile),
    workWithMe: workWithMe(profile),
    evidence: evidenceLines(profile, "you"),
  };
}
