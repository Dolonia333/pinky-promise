import { EscrowError } from "./errors.ts";

export class RhoClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  async listAccounts(): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/accounts`, {
      headers: { Authorization: `Bearer ${this.token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(5_000),
    }).catch(() => null);
    if (!response?.ok) throw new EscrowError("upstream_error", "Rho accounts request failed");
    return response.json();
  }
}
