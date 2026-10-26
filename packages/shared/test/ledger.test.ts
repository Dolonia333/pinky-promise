import { describe, expect, it } from "vitest";
import { accounts, balances, booksBalance, canTransition, isTerminal, transfer } from "../src/index.ts";

describe("ledger", () => {
  it("keeps the books balanced across fund and release", () => {
    const entries = [
      ...transfer(accounts.external, accounts.buyer("bakery"), 10000, "deposit"),
      ...transfer(accounts.buyer("bakery"), accounts.escrow("c1"), 1500, "fund", "c1"),
      ...transfer(accounts.escrow("c1"), accounts.seller("abe"), 1500, "release", "c1"),
    ];
    const totals = balances(entries);
    expect(booksBalance(entries)).toBe(true);
    expect(totals.get(accounts.buyer("bakery"))).toBe(8500);
    expect(totals.get(accounts.escrow("c1"))).toBe(0);
    expect(totals.get(accounts.seller("abe"))).toBe(1500);
  });

  it("rejects non-positive or fractional amounts", () => {
    expect(() => transfer("a", "b", 0, "x")).toThrow();
    expect(() => transfer("a", "b", 10.5, "x")).toThrow();
  });
});

describe("lifecycle", () => {
  it("allows the happy path and blocks skipping verification", () => {
    expect(canTransition("created", "funded")).toBe(true);
    expect(canTransition("verifying", "released")).toBe(true);
    expect(canTransition("delivered", "released")).toBe(false);
    expect(canTransition("released", "refunded")).toBe(false);
  });

  it("treats released and refunded as final", () => {
    expect(isTerminal("released")).toBe(true);
    expect(isTerminal("refunded")).toBe(true);
    expect(isTerminal("disputed")).toBe(false);
  });
});
