import type { Contract, InvoiceDocument, VerificationResult } from "@pinky/shared";

export interface Task {
  contractId: string;
  description: string;
  deadline: string;
  documents: InvoiceDocument[];
}

export class EscrowClient {
  private token: string | null = null;

  constructor(
    private readonly baseUrl: string,
    readonly agentId: string,
    private readonly key: string,
  ) {}

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (!this.token && path !== "/agents/token") await this.signIn();
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        ...(this.token ? { authorization: `Bearer ${this.token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await response.json()) as T & { message?: string };
    if (!response.ok) throw new Error(`${method} ${path} failed (${response.status}): ${data.message ?? "unknown error"}`);
    return data;
  }

  async signIn(): Promise<void> {
    const { token } = await this.request<{ token: string }>("POST", "/agents/token", { agentId: this.agentId, key: this.key });
    this.token = token;
  }

  async createContract(amountCents: number, description?: string): Promise<Contract> {
    return (await this.request<{ contract: Contract }>("POST", "/contracts", { amountCents, description })).contract;
  }

  async fund(contractId: string): Promise<Contract> {
    return (await this.request<{ contract: Contract }>("POST", `/contracts/${contractId}/fund`, {})).contract;
  }

  async accept(contractId: string): Promise<Contract> {
    return (await this.request<{ contract: Contract }>("POST", `/contracts/${contractId}/accept`, {})).contract;
  }

  async task(contractId: string): Promise<Task> {
    return this.request<Task>("GET", `/contracts/${contractId}/task`);
  }

  async deliver(contractId: string, delivery: unknown): Promise<{ contract: Contract; verification: VerificationResult }> {
    return this.request("POST", `/contracts/${contractId}/deliver`, { delivery });
  }
}

export function parseAgentKeys(raw: string | undefined): Map<string, string> {
  const keys = new Map<string, string>();
  for (const pair of (raw ?? "").split(",").map((part) => part.trim()).filter(Boolean)) {
    const [agentId, key] = pair.split("=");
    if (agentId && key) keys.set(agentId.trim(), key.trim());
  }
  return keys;
}
