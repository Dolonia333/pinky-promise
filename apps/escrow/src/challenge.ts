import { randomUUID } from "node:crypto";
import { sample, verifyDelivery, type Random } from "@pinky/shared";
import type { InvoiceSet } from "./escrow.ts";
import type { Attempt, Store } from "./store/types.ts";

const spotCheckCount = 2;
const recentLimit = 20;

export class ChallengeService {
  constructor(
    private readonly store: Store,
    private readonly invoiceSet: InvoiceSet,
    private readonly random: Random = Math.random,
    private readonly now: () => Date = () => new Date(),
  ) {}

  task() {
    return {
      description: "Extract vendor, invoice number, date (YYYY-MM-DD), and amount in cents from each invoice.",
      format: { invoices: [{ invoiceId: "doc-01", vendor: "string", invoiceNumber: "string", date: "YYYY-MM-DD", amountCents: 0 }] },
      documents: this.invoiceSet.documents,
    };
  }

  async submit(nickname: string, delivery: unknown): Promise<Attempt> {
    const now = this.now();
    const invoiceIds = this.invoiceSet.invoices.map((invoice) => invoice.invoiceId);
    const spotCheckIds = sample(invoiceIds, spotCheckCount, this.random);
    const result = verifyDelivery({
      delivery,
      invoiceIds,
      spotChecks: this.invoiceSet.invoices.filter((invoice) => spotCheckIds.includes(invoice.invoiceId)),
      expectedTotalCents: this.invoiceSet.invoices.reduce((sum, invoice) => sum + invoice.amountCents, 0),
      deadline: new Date(now.getTime() + 60_000),
      submittedAt: now,
    });

    const failedChecks = result.checks.filter((check) => !check.passed);
    const failed = failedChecks.find((check) => check.name === "verifier_directed_text") ?? failedChecks[0];
    const attempt: Attempt = {
      id: randomUUID(),
      nickname,
      verdict: result.verdict,
      flagged: result.flagged,
      reason: failed ? failed.detail : "All checks passed: the work was real",
      createdAt: now.toISOString(),
    };
    await this.store.saveAttempt(attempt);
    return attempt;
  }

  async scoreboard() {
    const attempts = await this.store.listAttempts();
    return {
      attempts: attempts.length,
      blocked: attempts.filter((attempt) => attempt.verdict !== "release").length,
      flagged: attempts.filter((attempt) => attempt.flagged).length,
      realWork: attempts.filter((attempt) => attempt.verdict === "release").length,
      recent: attempts.slice(-recentLimit).reverse(),
    };
  }
}
