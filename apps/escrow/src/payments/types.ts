export interface PaymentProvider {
  readonly name: string;
  hold(contractId: string, amountCents: number, idempotencyKey: string): Promise<string>;
  release(holdRef: string, payeeId: string, idempotencyKey: string): Promise<string>;
  refund(holdRef: string, idempotencyKey: string): Promise<string>;
}
