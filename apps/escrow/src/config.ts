import { randomBytes } from "node:crypto";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  JWT_SECRET: z.string().min(32).optional(),
  ADMIN_TOKEN: z.string().min(12).optional(),
  AGENT_KEYS: z.string().default(""),
  INVOICE_SEED: z.string().default("barton-creek-bakery"),
  CHALLENGE_SEED: z.string().optional(),
  SPOT_CHECK_SEED: z.string().optional(),
  BUYER_STARTING_BALANCE_CENTS: z.coerce.number().int().nonnegative().default(10_000),
  DASHBOARD_ORIGIN: z.string().default("*"),
  RHO_API_URL: z.string().url().default("https://rhoapi-sandbox.rho.co/api/v1"),
  RHO_API_TOKEN: z.string().default("sandbox"),
});

export interface Config {
  port: number;
  jwtSecret: string;
  adminToken: string | null;
  agentKeys: Map<string, string>;
  invoiceSeed: string;
  challengeSeed: string;
  spotCheckSeed: string | null;
  buyerStartingBalanceCents: number;
  dashboardOrigin: string;
  rhoApiUrl: string;
  rhoApiToken: string;
}

function parseAgentKeys(raw: string): Map<string, string> {
  const keys = new Map<string, string>();
  for (const pair of raw.split(",").map((part) => part.trim()).filter(Boolean)) {
    const [agentId, key] = pair.split("=");
    if (agentId && key) keys.set(agentId.trim(), key.trim());
  }
  return keys;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.parse(env);
  return {
    port: parsed.PORT,
    jwtSecret: parsed.JWT_SECRET ?? randomBytes(32).toString("hex"),
    adminToken: parsed.ADMIN_TOKEN ?? null,
    agentKeys: parseAgentKeys(parsed.AGENT_KEYS),
    invoiceSeed: parsed.INVOICE_SEED,
    challengeSeed: parsed.CHALLENGE_SEED ?? randomBytes(16).toString("hex"),
    spotCheckSeed: parsed.SPOT_CHECK_SEED ?? null,
    buyerStartingBalanceCents: parsed.BUYER_STARTING_BALANCE_CENTS,
    dashboardOrigin: parsed.DASHBOARD_ORIGIN,
    rhoApiUrl: parsed.RHO_API_URL.replace(/\/$/, ""),
    rhoApiToken: parsed.RHO_API_TOKEN,
  };
}
