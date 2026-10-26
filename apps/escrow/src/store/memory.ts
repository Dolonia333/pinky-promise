import type { Agent, LedgerEntry } from "@pinky/shared";
import { genesisHash, hashAuditEvent } from "../audit.ts";
import { EscrowError } from "../errors.ts";
import type { Attempt, AuditEvent, DeliveryRecord, Store, StoredContract, VerificationRecord } from "./types.ts";

export class MemoryStore implements Store {
  private agents = new Map<string, Agent>();
  private contracts = new Map<string, StoredContract>();
  private ledger: LedgerEntry[] = [];
  private deliveries = new Map<string, DeliveryRecord>();
  private verifications = new Map<string, VerificationRecord>();
  private audit: AuditEvent[] = [];
  private attempts: Attempt[] = [];

  async getAgent(id: string) {
    const agent = this.agents.get(id);
    return agent && { ...agent };
  }

  async listAgents() {
    return [...this.agents.values()].map((agent) => ({ ...agent }));
  }

  async saveAgent(agent: Agent) {
    this.agents.set(agent.id, { ...agent });
  }

  async insertContract(contract: StoredContract) {
    if (this.contracts.has(contract.id)) throw new EscrowError("conflict", `Contract ${contract.id} already exists`);
    this.contracts.set(contract.id, structuredClone(contract));
  }

  async getContract(id: string) {
    const contract = this.contracts.get(id);
    return contract && structuredClone(contract);
  }

  async listContracts() {
    return [...this.contracts.values()].map((contract) => structuredClone(contract));
  }

  async updateContract(
    id: string,
    expectedStatus: StoredContract["status"],
    changes: Partial<StoredContract>,
    entries: readonly LedgerEntry[],
  ) {
    const current = this.contracts.get(id);
    if (!current) throw new EscrowError("not_found", `Contract ${id} not found`);
    if (current.status !== expectedStatus) {
      throw new EscrowError("conflict", `Contract ${id} is ${current.status}, expected ${expectedStatus}`);
    }
    const updated = { ...current, ...changes };
    this.contracts.set(id, updated);
    this.ledger.push(...entries.map((entry) => ({ ...entry })));
    return structuredClone(updated);
  }

  async appendLedger(entries: readonly LedgerEntry[]) {
    this.ledger.push(...entries.map((entry) => ({ ...entry })));
  }

  async listLedger() {
    return this.ledger.map((entry) => ({ ...entry }));
  }

  async saveDelivery(delivery: DeliveryRecord) {
    this.deliveries.set(delivery.contractId, structuredClone(delivery));
  }

  async saveVerification(record: VerificationRecord) {
    this.verifications.set(record.contractId, structuredClone(record));
  }

  async getVerification(contractId: string) {
    const record = this.verifications.get(contractId);
    return record && structuredClone(record);
  }

  async appendAudit(event: Omit<AuditEvent, "seq" | "prevHash" | "hash">) {
    const unsigned = {
      ...event,
      seq: this.audit.length + 1,
      prevHash: this.audit.at(-1)?.hash ?? genesisHash,
    };
    const signed: AuditEvent = { ...unsigned, hash: hashAuditEvent(unsigned) };
    this.audit.push(signed);
    return structuredClone(signed);
  }

  async listAudit() {
    return this.audit.map((event) => structuredClone(event));
  }

  async saveAttempt(attempt: Attempt) {
    this.attempts.push({ ...attempt });
  }

  async listAttempts() {
    return this.attempts.map((attempt) => ({ ...attempt }));
  }
}
