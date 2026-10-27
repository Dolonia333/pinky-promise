import { createFileRoute, redirect } from "@tanstack/react-router";

/** Short public URL for the landing / founder test (A7). */
export const Route = createFileRoute("/go")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
