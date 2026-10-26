import { randomUUID } from "node:crypto";
import { EscrowError } from "../errors.ts";
import type { PaymentProvider } from "./types.ts";

interface Hold {
  contractId: string;
  amountCents: number;
  settled: "released" | "refunded" | null;
}

export class SimulatedPayments implements PaymentProvider {
  readonly name = "simulated";
  private holds = new Map<string, Hold>();
  private results = new Map<string, string>();

  private once(idempotencyKey: string, action: () => string): string {
    const previous = this.results.get(idempotencyKey);
    if (previous) return previous;
    const result = action();
    this.results.set(idempotencyKey, result);
    return result;
  }

  private settle(holdRef: string, outcome: "released" | "refunded"): void {
    const hold = this.holds.get(holdRef);
    if (!hold) throw new EscrowError("not_found", `Hold ${holdRef} not found`);
    if (hold.settled) throw new EscrowError("conflict", `Hold ${holdRef} was already ${hold.settled}`);
    hold.settled = outcome;
  }

  async hold(contractId: string, amountCents: number, idempotencyKey: string) {
    return this.once(idempotencyKey, () => {
      const ref = `sim_hold_${randomUUID()}`;
      this.holds.set(ref, { contractId, amountCents, settled: null });
      return ref;
    });
  }

  async release(holdRef: string, _payeeId: string, idempotencyKey: string) {
    return this.once(idempotencyKey, () => {
      this.settle(holdRef, "released");
      return `sim_pay_${randomUUID()}`;
    });
  }

  async refund(holdRef: string, idempotencyKey: string) {
    return this.once(idempotencyKey, () => {
      this.settle(holdRef, "refunded");
      return `sim_refund_${randomUUID()}`;
    });
  }
}
