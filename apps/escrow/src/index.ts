import { serve } from "@hono/node-server";
import { generateInvoices, seededRandom, seedFromString } from "@pinky/shared";
import { AgentAuth } from "./auth.ts";
import { ChallengeService } from "./challenge.ts";
import { loadConfig } from "./config.ts";
import { EscrowService } from "./escrow.ts";
import { createApp } from "./http/app.ts";
import { SimulatedPayments } from "./payments/simulated.ts";
import { RhoClient } from "./rho.ts";
import { roster } from "./roster.ts";
import { MemoryStore } from "./store/memory.ts";

const expiryIntervalMs = 30_000;

const config = loadConfig();
const store = new MemoryStore();
const spotCheckRandom = config.spotCheckSeed ? seededRandom(seedFromString(config.spotCheckSeed)) : Math.random;
const escrow = new EscrowService(store, new SimulatedPayments(), generateInvoices(seedFromString(config.invoiceSeed)), spotCheckRandom);
const challenge = new ChallengeService(store, generateInvoices(seedFromString(config.challengeSeed)));
const auth = new AgentAuth(config.jwtSecret, config.agentKeys, config.adminToken);
const rho = new RhoClient(config.rhoApiUrl, config.rhoApiToken);

await escrow.registerAgents(roster);
await escrow.deposit("buyer-bakery", config.buyerStartingBalanceCents);

const missingKeys = roster.filter((agent) => !config.agentKeys.has(agent.id)).map((agent) => agent.id);
if (missingKeys.length) console.warn(`No AGENT_KEYS entry for: ${missingKeys.join(", ")}`);
if (!config.adminToken) console.warn("ADMIN_TOKEN is not set, so dispute resolution and the kill switch are disabled");

setInterval(() => {
  escrow.expireOverdue().catch((error) => console.error("Expiry sweep failed", error));
}, expiryIntervalMs);

const app = createApp({ escrow, challenge, auth, store, rho, dashboardOrigin: config.dashboardOrigin });
serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
  console.log(`Pinky Promise escrow listening on http://localhost:${port}`);
});
