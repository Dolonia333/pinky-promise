import { createFileRoute } from "@tanstack/react-router";
import { UnauthorizedError, requireUserId } from "@/lib/auth/verify.server";
import { issueCode } from "@/lib/pinky/store.server";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export const Route = createFileRoute("/upload-codes")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const userId = await requireUserId();
          const issued = await issueCode(userId);
          return json(issued, 201);
        } catch (err) {
          if (err instanceof UnauthorizedError) return json({ error: "Sign in first." }, 401);
          return json({ error: "Could not make a code." }, 500);
        }
      },
    },
  },
});
