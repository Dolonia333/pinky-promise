export type ContractStatus =
  | "created"
  | "funded"
  | "accepted"
  | "delivered"
  | "verifying"
  | "released"
  | "refunded"
  | "disputed";

export type AgentRole = "buyer" | "seller";

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  trustScore: number;
  frozen: boolean;
}

export interface Invoice {
  invoiceId: string;
  vendor: string;
  invoiceNumber: string;
  date: string;
  amountCents: number;
}

export interface InvoiceDocument {
  invoiceId: string;
  document: string;
}

export interface Contract {
  id: string;
  buyerId: string;
  sellerId: string | null;
  description: string;
  invoiceIds: string[];
  amountCents: number;
  status: ContractStatus;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export type CheckName =
  | "format"
  | "completeness"
  | "spot_checks"
  | "deadline"
  | "sanity"
  | "verifier_directed_text";

export interface CheckResult {
  name: CheckName;
  passed: boolean;
  detail: string;
}

export type Verdict = "release" | "refund" | "dispute";

export interface VerificationResult {
  verdict: Verdict;
  flagged: boolean;
  checks: CheckResult[];
}
