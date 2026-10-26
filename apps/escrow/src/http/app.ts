import { balances, booksBalance } from "@pinky/shared";
import { Hono, type Context } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { z } from "zod";
import { verifyAuditChain } from "../audit.ts";
import type { AgentAuth } from "../auth.ts";
import type { ChallengeService } from "../challenge.ts";
import { EscrowError } from "../errors.ts";
import { toPublicContract, type EscrowService } from "../escrow.ts";
import type { RhoClient } from "../rho.ts";
import type { Store } from "../store/types.ts";
import { RateLimiter } from "./rate-limit.ts";

export interface AppDeps {
  escrow: EscrowService;
  challenge: ChallengeService;
  auth: AgentAuth;
  store: Store;
  rho: RhoClient;
  dashboardOrigin: string;
}

type Env = { Variables: { agentId: string } };

const tokenRequest = z.object({ agentId: z.string(), key: z.string() });
const createContractRequest = z.object({
  description: z.string().max(500).optional(),
  amountCents: z.number().int().positive(),
  deadlineMinutes: z.number().int().positive().max(24 * 60).optional(),
});
const deliverRequest = z.object({ delivery: z.unknown() });
const resolveRequest = z.object({ decision: z.enum(["release", "refund"]) });
const killSwitchRequest = z.object({ paused: z.boolean() });
const attemptRequest = z.object({ nickname: z.string().trim().min(1).max(24), delivery: z.unknown() });

async function parseBody<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  const body = await c.req.json().catch(() => {
    throw new EscrowError("bad_request", "Request body must be JSON");
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new EscrowError("bad_request", parsed.error.issues.map((issue) => issue.message).join("; "));
  return parsed.data;
}

function contractId(c: Context): string {
  const id = c.req.param("id");
  if (!id) throw new EscrowError("bad_request", "Missing contract id");
  return id;
}

function clientKey(c: Context): string {
  return c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || c.req.header("x-real-ip") || "local";
}

export function createApp(deps: AppDeps) {
  const { escrow, challenge, auth, store, rho } = deps;
  const app = new Hono<Env>();
  const challengeLimiter = new RateLimiter(3, 60_000);
  const idempotent = new Map<string, unknown>();

  app.use("*", cors({ origin: deps.dashboardOrigin }));
  app.use("/contracts/*", bodyLimit({ maxSize: 64 * 1024 }));
  app.use("/challenge/*", bodyLimit({ maxSize: 5 * 1024 }));

  app.onError((error, c) => {
    if (error instanceof EscrowError) return c.json({ error: error.code, message: error.message }, error.status as 400);
    console.error(error);
    return c.json({ error: "internal", message: "Something went wrong" }, 500);
  });

  const requireAgent = async (c: Context<Env>, next: () => Promise<void>) => {
    c.set("agentId", await auth.verify(c.req.header("authorization")));
    await next();
  };

  const requireAdmin = async (c: Context, next: () => Promise<void>) => {
    auth.verifyAdmin(c.req.header("authorization"));
    await next();
  };

  const once = async (c: Context<Env>, action: () => Promise<unknown>) => {
    const key = c.req.header("idempotency-key");
    const cacheKey = key && `${c.get("agentId")}:${c.req.path}:${key}`;
    if (cacheKey && idempotent.has(cacheKey)) return c.json(idempotent.get(cacheKey) as object);
    const result = await action();
    if (cacheKey) idempotent.set(cacheKey, result);
    return c.json(result as object);
  };

  app.get("/healthz", (c) => c.json({ ok: true, paused: escrow.isPaused }));

  app.post("/agents/token", async (c) => {
    const { agentId, key } = await parseBody(c, tokenRequest);
    return c.json({ token: await auth.issue(agentId, key) });
  });

  app.get("/agents", async (c) => c.json({ agents: await store.listAgents() }));

  app.get("/contracts", async (c) => {
    const contracts = await store.listContracts();
    return c.json({ contracts: contracts.map(toPublicContract).reverse() });
  });

  app.get("/contracts/:id", async (c) => c.json(await escrow.getContract(contractId(c))));

  app.post("/contracts", requireAgent, async (c) => {
    const input = await parseBody(c, createContractRequest);
    return once(c, async () => ({ contract: toPublicContract(await escrow.createContract(c.get("agentId"), input)) }));
  });

  app.post("/contracts/:id/fund", requireAgent, (c) =>
    once(c, async () => ({ contract: toPublicContract(await escrow.fund(c.get("agentId"), contractId(c))) })),
  );

  app.post("/contracts/:id/accept", requireAgent, (c) =>
    once(c, async () => ({ contract: toPublicContract(await escrow.accept(c.get("agentId"), contractId(c))) })),
  );

  app.get("/contracts/:id/task", requireAgent, async (c) => c.json(await escrow.task(c.get("agentId"), contractId(c))));

  app.post("/contracts/:id/deliver", requireAgent, async (c) => {
    const { delivery } = await parseBody(c, deliverRequest);
    return once(c, async () => {
      const result = await escrow.deliver(c.get("agentId"), contractId(c), delivery);
      return { contract: toPublicContract(result.contract), verification: result.verification };
    });
  });

  app.post("/contracts/:id/resolve", requireAdmin, async (c) => {
    const { decision } = await parseBody(c, resolveRequest);
    return c.json({ contract: toPublicContract(await escrow.resolve(contractId(c), decision, "admin")) });
  });

  app.post("/admin/kill-switch", requireAdmin, async (c) => {
    const { paused } = await parseBody(c, killSwitchRequest);
    await escrow.setPaused(paused, "admin");
    return c.json({ paused: escrow.isPaused });
  });

  app.get("/ledger", async (c) => {
    const entries = await store.listLedger();
    return c.json({ balances: Object.fromEntries(balances(entries)), booksBalance: booksBalance(entries), entries });
  });

  app.get("/audit", async (c) => {
    const events = await store.listAudit();
    return c.json({ chainValid: verifyAuditChain(events), events });
  });

  app.get("/challenge/task", (c) => c.json(challenge.task()));

  app.post("/challenge/attempts", async (c) => {
    if (!challengeLimiter.allow(clientKey(c))) throw new EscrowError("rate_limited", "Slow down: 3 attempts per minute");
    const { nickname, delivery } = await parseBody(c, attemptRequest);
    return c.json({ attempt: await challenge.submit(nickname, delivery) });
  });

  app.get("/challenge/scoreboard", async (c) => c.json(await challenge.scoreboard()));

  app.get("/rho/accounts", async (c) => c.json(await rho.listAccounts()));

  return app;
}
