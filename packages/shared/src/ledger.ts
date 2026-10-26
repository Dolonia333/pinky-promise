export interface LedgerEntry {
  contractId: string | null;
  account: string;
  amountCents: number;
  memo: string;
}

export const accounts = {
  external: "external",
  buyer: (agentId: string) => `buyer:${agentId}`,
  escrow: (contractId: string) => `escrow:${contractId}`,
  seller: (agentId: string) => `seller:${agentId}`,
};

export function transfer(
  from: string,
  to: string,
  amountCents: number,
  memo: string,
  contractId: string | null = null,
): [LedgerEntry, LedgerEntry] {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error("Transfer amount must be a positive whole number of cents");
  }
  return [
    { contractId, account: from, amountCents: -amountCents, memo },
    { contractId, account: to, amountCents, memo },
  ];
}

export function balances(entries: readonly LedgerEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    totals.set(entry.account, (totals.get(entry.account) ?? 0) + entry.amountCents);
  }
  return totals;
}

export function booksBalance(entries: readonly LedgerEntry[]): boolean {
  return entries.reduce((sum, entry) => sum + entry.amountCents, 0) === 0;
}
