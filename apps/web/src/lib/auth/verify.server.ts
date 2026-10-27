import { getRequest } from "@tanstack/react-start/server";
import { auth } from "./server";

export class UnauthorizedError extends Error {
  readonly status = 401;

  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function getSessionUserId(): Promise<string | null> {
  const request = getRequest();
  if (!request) return null;
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user.id ?? null;
}

export async function requireUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) throw new UnauthorizedError();
  return userId;
}
