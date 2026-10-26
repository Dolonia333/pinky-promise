import type { Agent, Contract, LedgerEntry, VerificationResult, Verdict } from "@pinky/shared";

export interface StoredContract extends Contract {
  spotCheckIds: string[];
  expectedTotalCents: number;
  holdRef: string | null;
  paymentRef: string | null;
}

export interface DeliveryRecord {
  contractId: string;
  sellerId: string;
  payload: unknown;
  submittedAt: string;
}

export interface VerificationRecord {
  contractId: string;
  result: VerificationResult;
  createdAt: string;
}

export interface AuditEvent {
  seq: number;
  contractId: string | null;
  event: string;
  actor: string;
  data: Record<string, unknown>;
  prevHash: string;
  hash: string;
  createdAt: string;
}

export interface Attempt {
  id: string;
  nickname: string;
  verdict: Verdict;
  flagged: boolean;
  reason: string;
  createdAt: string;
}

export interface Store {
  getAgent(id: string): Promise<Agent | undefined>;
  listAgents(): Promise<Agent[]>;
  saveAgent(agent: Agent): Promise<void>;

  insertContract(contract: StoredContract): Promise<void>;
  getContract(id: string): Promise<StoredContract | undefined>;
  listContracts(): Promise<StoredContract[]>;
  updateContract(
    id: string,
    expectedStatus: Contract["status"],
    changes: Partial<StoredContract>,
    entries: readonly LedgerEntry[],
  ): Promise<StoredContract>;

  appendLedger(entries: readonly LedgerEntry[]): Promise<void>;
  listLedger(): Promise<LedgerEntry[]>;

  saveDelivery(delivery: DeliveryRecord): Promise<void>;
  saveVerification(record: VerificationRecord): Promise<void>;
  getVerification(contractId: string): Promise<VerificationRecord | undefined>;

  appendAudit(event: Omit<AuditEvent, "seq" | "prevHash" | "hash">): Promise<AuditEvent>;
  listAudit(): Promise<AuditEvent[]>;

  saveAttempt(attempt: Attempt): Promise<void>;
  listAttempts(): Promise<Attempt[]>;
}
