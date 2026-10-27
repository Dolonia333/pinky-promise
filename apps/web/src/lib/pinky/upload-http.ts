import { redeemCode } from "./store.server";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export async function handleProfilePost(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "That isn't JSON." }, 400);
  }
  if (!body || typeof body !== "object") return json({ error: "Missing payload." }, 400);
  const record = body as { code?: unknown; payload?: unknown };
  if (typeof record.code !== "string") return json({ error: "Missing upload code." }, 400);
  const raw = JSON.stringify(record.payload ?? null);
  if (raw.length > 50_000) return json({ error: "Payload is too large." }, 413);
  const result = await redeemCode(record.code, record.payload);
  if (!result.ok) return json({ error: result.error }, result.status);
  const origin = new URL(request.url).origin;
  return json({
    id: result.profileId,
    url: `${origin}/profile`,
    profileId: result.profileId,
    path: result.path,
  });
}
