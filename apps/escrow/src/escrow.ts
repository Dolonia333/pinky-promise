import { randomUUID } from "node:crypto";
import {
  accounts,
  assertTransition,
  sample,
  transfer,
  verifyDelivery,
  type Agent,
  type ContractStatus,
  type Invoice,
  type InvoiceDocument,
  type LedgerEntry,
  type Random,
  type VerificationResult,
  type Verdict,
} from "@pinky/shared";
import { EscrowError } from "./errors.ts";
import type { PaymentProvider } from "./payments/types.ts";
import { startingTrustScore } from "./roster.ts";
import type { Store, StoredContract } from "./store/types.ts";

export interface InvoiceSet {
  invoices: Invoice[];
  documents: InvoiceDocument[];
}

export interface CreateContractInput {
  description?: string;
  amountCents: number;
  deadlineMinutes?: number;
}

export type PublicContract = Omit<StoredContract, "spotCheckIds" | "expectedTotalCents">;

const spotCheckCount = 2;
const maxTrust = 100;
const trustReward = 5;
const trustPenalty = 25;

export function toPublicContract(contract: StoredContract): PublicContract {
  const { spotCheckIds: _spotCheckIds, expectedTotalCents: _expectedTotalCents, ...rest } = contract;
  return rest;
}

export class EscrowService {
  private paused = false;

  constructor(
    private readonly store: Store,
    private readonly payments: PaymentProvider,
    private readonly invoiceSet: InvoiceSet,
    private readonly random: Random = Math.random,
    private readonly now: () => Date = () => new Date(),
  ) {}

  get isPaused(): boolean {
    return this.paused;
  }

  async registerAgents(agents: readonly Omit<Agent, "trustScore" | "frozen">[]): Promise<void> {
    for (const agent of agents) {
      const existing = await this.store.getAgent(agent.id);
      if (!existing) await this.store.saveAgent({ ...agent, trustScore: startingTrustScore, frozen: false });
    }
  }

  async deposit(buyerId: string, amountCents: number): Promise<void> {
    await this.requireAgent(buyerId, "buyer");
    await this.store.appendLedger(transfer(accounts.external, accounts.buyer(buyerId), amountCents, "Starting balance"));
    await this.record(null, "deposit", buyerId, { amountCents });
  }

  async availableBalance(buyerId: string): Promise<number> {
    const account = accounts.buyer(buyerId);
    const entries = await this.store.listLedger();
    return entries.filter((entry) => entry.account === account).reduce((sum, entry) => sum + entry.amountCents, 0);
  }

  async createContract(buyerId: string, input: CreateContractInput): Promise<StoredContract> {
    this.assertNotPaused();
    await this.requireAgent(buyerId, "buyer");
    if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
      throw new EscrowError("bad_request", "amountCents must be a positive whole number");
    }

    const now = this.now();
    const invoiceIds = this.invoiceSet.invoices.map((invoice) => invoice.invoiceId);
    const contract: StoredContract = {
      id: `ct_${randomUUID().slice(0, 8)}`,
      buyerId,
      sellerId: null,
      description: input.description ?? `Extract vendor, invoice number, date, and amount from ${invoiceIds.length} invoices`,
      invoiceIds,
      amountCents: input.amountCents,
      status: "created",
      deadline: new Date(now.getTime() + (input.deadlineMinutes ?? 30) * 60_000).toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      spotCheckIds: sample(invoiceIds, spotCheckCount, this.random),
      expectedTotalCents: this.invoiceSet.invoices.reduce((sum, invoice) => sum + invoice.amountCents, 0),
      holdRef: null,
      paymentRef: null,
    };
    await this.store.insertContract(contract);
    await this.record(contract.id, "contract_created", buyerId, { amountCents: contract.amountCents });
    return contract;
  }

  async fund(buyerId: string, contractId: string): Promise<StoredContract> {
    this.assertNotPaused();
    const contract = await this.requireContract(contractId);
    if (contract.buyerId !== buyerId) throw new EscrowError("forbidden", "Only the buyer can fund this contract");
    this.expectStatus(contract, "created");

    const available = await this.availableBalance(buyerId);
    if (available < contract.amountCents) {
      throw new EscrowError("insufficient_funds", "Buyer balance is too low to fund this contract");
    }

    const holdRef = await this.payments.hold(contract.id, contract.amountCents, `hold:${contract.id}`);
    const funded = await this.move(contract, "funded", { holdRef }, [
      ...transfer(accounts.buyer(buyerId), accounts.escrow(contract.id), contract.amountCents, "Funds locked", contract.id),
    ]);
    await this.record(contract.id, "funded", buyerId, { amountCents: contract.amountCents, holdRef });
    return funded;
  }

  async accept(sellerId: string, contractId: string): Promise<StoredContract> {
    this.assertNotPaused();
    const seller = await this.requireAgent(sellerId, "seller");
    if (seller.frozen) throw new EscrowError("forbidden", `${seller.name} is frozen and cannot take new work`);
    const contract = await this.requireContract(contractId);
    this.expectStatus(contract, "funded");

    const accepted = await this.move(contract, "accepted", { sellerId }, []);
    await this.record(contract.id, "accepted", sellerId, {});
    return accepted;
  }

  async task(sellerId: string, contractId: string) {
    const contract = await this.requireContract(contractId);
    if (contract.sellerId !== sellerId) throw new EscrowError("forbidden", "This contract belongs to another seller");
    const documents = this.invoiceSet.documents.filter((doc) => contract.invoiceIds.includes(doc.invoiceId));
    return { contractId: contract.id, description: contract.description, deadline: contract.deadline, documents };
  }

  async deliver(sellerId: string, contractId: string, payload: unknown) {
    this.assertNotPaused();
    const seller = await this.requireAgent(sellerId, "seller");
    const contract = await this.requireContract(contractId);
    if (contract.sellerId !== sellerId) throw new EscrowError("forbidden", "This contract belongs to another seller");
    this.expectStatus(contract, "accepted");

    const submittedAt = this.now();
    await this.store.saveDelivery({ contractId, sellerId, payload, submittedAt: submittedAt.toISOString() });
    const delivered = await this.move(contract, "delivered", {}, []);
    await this.record(contractId, "delivered", sellerId, {});
    const verifying = await this.move(delivered, "verifying", {}, []);

    const spotChecks = this.invoiceSet.invoices.filter((invoice) => contract.spotCheckIds.includes(invoice.invoiceId));
    const result = verifyDelivery({
      delivery: payload,
      invoiceIds: contract.invoiceIds,
      spotChecks,
      expectedTotalCents: contract.expectedTotalCents,
      deadline: new Date(contract.deadline),
      submittedAt,
    });
    await this.store.saveVerification({ contractId, result, createdAt: this.now().toISOString() });
    await this.record(contractId, "verified", "verifier", { verdict: result.verdict, flagged: result.flagged });

    const verdict: Verdict = result.verdict === "release" && this.paused ? "dispute" : result.verdict;
    const settled = await this.settle(verifying, verdict, "verifier");
    await this.adjustTrust(seller, result);
    return { contract: settled, verification: result };
  }

  async resolve(contractId: string, decision: "release" | "refund", actor: string): Promise<StoredContract> {
    const contract = await this.requireContract(contractId);
    this.expectStatus(contract, "disputed");
    return this.settle(contract, decision, actor);
  }

  async expireOverdue(): Promise<StoredContract[]> {
    const now = this.now().getTime();
    const overdue = (await this.store.listContracts()).filter(
      (contract) => (contract.status === "funded" || contract.status === "accepted") && new Date(contract.deadline).getTime() < now,
    );
    const expired: StoredContract[] = [];
    for (const contract of overdue) {
      expired.push(await this.settle(contract, "refund", "deadline"));
    }
    return expired;
  }

  async setPaused(paused: boolean, actor: string): Promise<void> {
    this.paused = paused;
    await this.record(null, paused ? "kill_switch_on" : "kill_switch_off", actor, {});
  }

  async getContract(contractId: string) {
    const contract = await this.requireContract(contractId);
    const verification = await this.store.getVerification(contractId);
    return { contract: toPublicContract(contract), verification: verification?.result ?? null };
  }

  private async settle(contract: StoredContract, verdict: Verdict, actor: string): Promise<StoredContract> {
    if (verdict === "dispute") {
      const disputed = await this.move(contract, "disputed", {}, []);
      await this.record(contract.id, "disputed", actor, {});
      return disputed;
    }

    const holdRef = contract.holdRef;
    if (!holdRef) throw new EscrowError("conflict", `Contract ${contract.id} has no funds on hold`);

    if (verdict === "release") {
      const sellerId = contract.sellerId;
      if (!sellerId) throw new EscrowError("conflict", `Contract ${contract.id} has no seller`);
      const paymentRef = await this.payments.release(holdRef, sellerId, `release:${contract.id}`);
      const released = await this.move(contract, "released", { paymentRef }, [
        ...transfer(accounts.escrow(contract.id), accounts.seller(sellerId), contract.amountCents, "Payment released", contract.id),
      ]);
      await this.record(contract.id, "released", actor, { paymentRef, amountCents: contract.amountCents });
      return released;
    }

    const paymentRef = await this.payments.refund(holdRef, `refund:${contract.id}`);
    const refunded = await this.move(contract, "refunded", { paymentRef }, [
      ...transfer(accounts.escrow(contract.id), accounts.buyer(contract.buyerId), contract.amountCents, "Refunded to buyer", contract.id),
    ]);
    await this.record(contract.id, "refunded", actor, { paymentRef, amountCents: contract.amountCents });
    return refunded;
  }

  private async adjustTrust(seller: Agent, result: VerificationResult): Promise<void> {
    const updated = { ...seller };
    if (result.flagged) {
      updated.trustScore = 0;
      updated.frozen = true;
    } else if (result.verdict === "release") {
      updated.trustScore = Math.min(maxTrust, seller.trustScore + trustReward);
    } else if (result.verdict === "refund") {
      updated.trustScore = Math.max(0, seller.trustScore - trustPenalty);
    }
    await this.store.saveAgent(updated);
    if (updated.trustScore !== seller.trustScore || updated.frozen !== seller.frozen) {
      await this.record(null, "trust_changed", "verifier", {
        agentId: seller.id,
        trustScore: updated.trustScore,
        frozen: updated.frozen,
      });
    }
  }

  private async move(
    contract: StoredContract,
    to: ContractStatus,
    changes: Partial<StoredContract>,
    entries: readonly LedgerEntry[],
  ): Promise<StoredContract> {
    assertTransition(contract.status, to);
    return this.store.updateContract(
      contract.id,
      contract.status,
      { ...changes, status: to, updatedAt: this.now().toISOString() },
      entries,
    );
  }

  private expectStatus(contract: StoredContract, status: ContractStatus): StoredContract {
    if (contract.status !== status) {
      throw new EscrowError("conflict", `Contract ${contract.id} is ${contract.status}, not ${status}`);
    }
    return contract;
  }

  private assertNotPaused(): void {
    if (this.paused) throw new EscrowError("paused", "Escrow is paused by the kill switch");
  }

  private async requireAgent(id: string, role: Agent["role"]): Promise<Agent> {
    const agent = await this.store.getAgent(id);
    if (!agent) throw new EscrowError("not_found", `Agent ${id} not found`);
    if (agent.role !== role) throw new EscrowError("forbidden", `Agent ${id} is not a ${role}`);
    return agent;
  }

  private async requireContract(id: string): Promise<StoredContract> {
    const contract = await this.store.getContract(id);
    if (!contract) throw new EscrowError("not_found", `Contract ${id} not found`);
    return contract;
  }

  private async record(contractId: string | null, event: string, actor: string, data: Record<string, unknown>) {
    await this.store.appendAudit({ contractId, event, actor, data, createdAt: this.now().toISOString() });
  }
}
