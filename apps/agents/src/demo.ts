import { formatCents, seedFromString } from "@pinky/shared";
import { EscrowClient, parseAgentKeys } from "./client.ts";
import { coastingCarl, honestAbe, slySal, type Seller } from "./sellers.ts";

const baseUrl = process.env.ESCROW_URL ?? "http://localhost:8787";
const keys = parseAgentKeys(process.env.AGENT_KEYS);
const jobPriceCents = 1500;

function clientFor(agentId: string): EscrowClient {
  const key = keys.get(agentId);
  if (!key) throw new Error(`Add ${agentId}=<key> to AGENT_KEYS`);
  return new EscrowClient(baseUrl, agentId, key);
}

async function runAct(act: number, buyer: EscrowClient, seller: Seller): Promise<void> {
  console.log(`\nAct ${act}: Barton Creek Bakery hires ${seller.name} for ${formatCents(jobPriceCents)}`);
  const sellerClient = clientFor(seller.id);

  const contract = await buyer.createContract(jobPriceCents);
  await buyer.fund(contract.id);
  console.log(`  ${contract.id}: funds locked in escrow`);

  await sellerClient.accept(contract.id);
  const task = await sellerClient.task(contract.id);
  const delivery = await seller.work(task.documents);
  const { contract: settled, verification } = await sellerClient.deliver(contract.id, delivery);

  for (const check of verification.checks) {
    console.log(`  ${check.passed ? "pass" : "FAIL"}  ${check.name.padEnd(22)} ${check.detail}`);
  }
  const outcome =
    settled.status === "released"
      ? `paid ${formatCents(settled.amountCents)} to ${seller.name}`
      : settled.status === "refunded"
        ? `refunded ${formatCents(settled.amountCents)} to the bakery`
        : "sent to a human for review";
  console.log(`  Result: ${outcome}${verification.flagged ? " (flagged for instructing the verifier)" : ""}`);
}

async function main(): Promise<void> {
  const buyer = clientFor("buyer-bakery");
  const sellers = [
    honestAbe({ apiKey: process.env.ANTHROPIC_API_KEY, model: process.env.ABE_MODEL ?? "claude-haiku-5-5", log: (m) => console.log(`  ${m}`) }),
    coastingCarl(seedFromString(process.env.CARL_SEED ?? "coasting")),
    slySal(),
  ];

  for (const [index, seller] of sellers.entries()) {
    await runAct(index + 1, buyer, seller);
  }

  const ledger = (await (await fetch(`${baseUrl}/ledger`)).json()) as { booksBalance: boolean };
  console.log(`\nBooks balance: ${ledger.booksBalance ? "yes" : "NO"}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
