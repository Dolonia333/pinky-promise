import { createFileRoute } from "@tanstack/react-router";
import { handleProfilePost } from "@/lib/pinky/upload-http";

export const Route = createFileRoute("/api/profiles")({
  server: {
    handlers: {
      POST: async ({ request }) => handleProfilePost(request),
    },
  },
});
