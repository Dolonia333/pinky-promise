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
5. **Outcome:** the payment is **released** to the seller, **refunded** to the buyer, or **disputed** and decided by a human on their phone. Contracts past their deadline are refunded automatically.

No AI decides who gets paid. The verifier is plain code, so a seller can't talk its way into the money.

## The demo

The buyer is **Barton Creek Bakery** (a fictional company), which needs 10 vendor invoices turned into structured JSON for $15. Three seller agents compete for the job:

| Seller | Behavior | Result |
| --- | --- | --- |
| Honest Abe | Does the job properly | Paid |
| Coasting Carl | Skips invoices or makes up numbers | Caught by spot checks, buyer refunded |
| Sly Sal | Delivers junk and tells the verifier to approve payment | Flagged, refunded, trust score slashed |

## Architecture

| Component | Tech |
| --- | --- |
| Escrow service | TypeScript on Node (language decision pending) |
| Data, auth, live updates | Supabase (Postgres, Auth, RLS, Realtime) |
| Agents | TypeScript with an LLM SDK |
| Dashboard | React |
| Source of truth for invoices | Rho API sandbox (read-only) |
| Settlement | Simulated ledger, with an optional upgrade to test USDC in our own escrow contract on Base Sepolia |

## Status

Work in progress. Setup instructions, the verifier details, and performance numbers will be added as the project is built.

## Note

Pinky Promise demonstrates escrow-style holds. It is not a licensed escrow service, and no real money moves: payouts are simulated or use testnet tokens only.

## Team

- Shawnaya Williams
- Zion Van Zandt
