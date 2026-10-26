import type { ContractStatus } from "./types.ts";

const transitions: Record<ContractStatus, readonly ContractStatus[]> = {
  created: ["funded"],
  funded: ["accepted", "refunded"],
  accepted: ["delivered", "refunded"],
  delivered: ["verifying"],
  verifying: ["released", "refunded", "disputed"],
  disputed: ["released", "refunded"],
  released: [],
  refunded: [],
};

export function canTransition(from: ContractStatus, to: ContractStatus): boolean {
  return transitions[from].includes(to);
}

export function isTerminal(status: ContractStatus): boolean {
  return transitions[status].length === 0;
}

export class TransitionError extends Error {
  constructor(
    readonly from: ContractStatus,
    readonly to: ContractStatus,
  ) {
    super(`Cannot move a contract from ${from} to ${to}`);
  }
}

export function assertTransition(from: ContractStatus, to: ContractStatus): void {
  if (!canTransition(from, to)) throw new TransitionError(from, to);
}
