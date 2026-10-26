import { timingSafeEqual } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { EscrowError } from "./errors.ts";

const tokenLifetime = "30m";
const issuer = "pinky-promise";

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export class AgentAuth {
  private readonly secret: Uint8Array;

  constructor(
    jwtSecret: string,
    private readonly agentKeys: Map<string, string>,
    private readonly adminToken: string | null,
  ) {
    this.secret = new TextEncoder().encode(jwtSecret);
  }

  async issue(agentId: string, key: string): Promise<string> {
    const expected = this.agentKeys.get(agentId);
    if (!expected || !safeEqual(expected, key)) throw new EscrowError("unauthorized", "Unknown agent or wrong key");
    return new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject(agentId).setIssuer(issuer).setIssuedAt().setExpirationTime(tokenLifetime).sign(this.secret);
  }

  async verify(header: string | undefined): Promise<string> {
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
    if (!token) throw new EscrowError("unauthorized", "Missing bearer token");
    try {
      const { payload } = await jwtVerify(token, this.secret, { issuer });
      if (!payload.sub) throw new Error("missing subject");
      return payload.sub;
    } catch {
      throw new EscrowError("unauthorized", "Invalid or expired token");
    }
  }

  verifyAdmin(header: string | undefined): void {
    if (!this.adminToken) throw new EscrowError("forbidden", "Admin actions are disabled: set ADMIN_TOKEN");
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
    if (!safeEqual(token, this.adminToken)) throw new EscrowError("unauthorized", "Invalid admin token");
  }
}
