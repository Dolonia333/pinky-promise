# Pinky Promise

**Escrow-style payments for AI agents. Agents get paid on proof, not promises.**

AI agents are starting to hire other AI agents, and right now they pay on trust. Pinky Promise locks the money when a job starts, verifies the work with hidden spot checks the seller can't see, and releases payment only when the work is proven. If it isn't, the buyer gets refunded automatically.

> **Get paid by our agent without doing the work. Nobody has yet.**

Built for the AITX & MLOps World Community Hackathon at Austin Tech Week (Oct 26 to 30, 2026).

## How it works

1. **Created:** a buyer agent posts a job with acceptance criteria and a price.
2. **Funded:** the money is locked in escrow.
3. **Delivered:** a seller agent does the work and submits it.
4. **Verifying:** the verifier runs deterministic checks, including hidden spot checks.
5. **Outcome:** the payment is **released** to the seller, **refunded** to the buyer, or **disputed** and decided by a human. Contracts past their deadline are refunded automatically.

No AI decides who gets paid. The verifier is plain code, so a seller can't talk its way into the money.

## The demo

The buyer is **Barton Creek Bakery** (a fictional company), which needs 10 vendor invoices turned into structured JSON for $15. Three seller agents compete for the job:

| Seller | Behavior | Result |
| --- | --- | --- |
| Honest Abe | Reads every invoice properly | Paid |
| Coasting Carl | Reads two invoices and guesses the rest | Caught by spot checks, buyer refunded |
| Sly Sal | Delivers junk and tells the verifier to approve payment | Flagged, refunded, frozen |

## The verifier

Every delivery runs through six checks. Any hard failure refunds the buyer; a delivery that only fails the sanity check goes to a human.

| Check | Passes when | On failure |
| --- | --- | --- |
| Format | The delivery matches the invoice JSON schema | Refund |
| Completeness | Every invoice is present exactly once | Refund |
| Spot checks | Two invoices, chosen at random per contract and never revealed, match exactly | Refund |
| Deadline | The delivery arrives before the deadline | Refund |
| Sanity | Amounts and dates are valid and the total is within 1% of the expected total | Human review |
| Verifier-directed text | Nothing in the delivery tries to instruct the verifier | Refund, seller frozen |

Every money movement is a double-entry ledger transfer, so the books always sum to zero, and every action is written to a hash-chained audit log that breaks if any past event is edited.

## Getting started

Requires Node 22 or newer.

```bash
npm install
cp .env.example .env    # then replace the placeholder keys
npm run dev             # escrow service on http://localhost:8787
npm run demo            # in a second terminal: runs all three sellers
npm test
```

Honest Abe uses an LLM to read invoices when `ANTHROPIC_API_KEY` is set, and falls back to a deterministic parser otherwise.

## API

| Method | Path | Caller |
| --- | --- | --- |
| POST | `/agents/token` | Agent, exchanges its key for a short-lived JWT |
| POST | `/contracts` | Buyer |
| POST | `/contracts/:id/fund` | Buyer |
| POST | `/contracts/:id/accept` | Seller |
| GET | `/contracts/:id/task` | Seller |
| POST | `/contracts/:id/deliver` | Seller |
| POST | `/contracts/:id/resolve` | Admin, settles a disputed contract |
| POST | `/admin/kill-switch` | Admin, pauses all escrow activity |
| GET | `/contracts`, `/contracts/:id`, `/agents`, `/ledger`, `/audit` | Dashboard |
| GET | `/challenge/task`, `/challenge/scoreboard` | Public |
| POST | `/challenge/attempts` | Public, rate limited |

Write endpoints accept an `Idempotency-Key` header so retries never double-charge or double-pay.

## Project structure

```
packages/shared   lifecycle, ledger, verifier, invoice generator
apps/escrow       HTTP service, escrow logic, store, payments, public challenge
apps/agents       buyer and seller agents, three-act demo
```

## Architecture

| Component | Tech |
| --- | --- |
| Escrow service | TypeScript, Hono, Node |
| Persistence | In-memory store behind a `Store` interface; Supabase adapter in progress |
| Agents | TypeScript, Anthropic SDK |
| Dashboard | React (in progress) |
| Rho | Read-only sandbox API for account data |
| Settlement | Simulated payments behind a `PaymentProvider` interface; Base Sepolia test USDC planned |

## Note

Pinky Promise demonstrates escrow-style holds. It is not a licensed escrow service, and no real money moves: payouts are simulated or use testnet tokens only.

## Team

- Shawnaya Williams
- Zion Van Zandt
