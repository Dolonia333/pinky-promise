import { createFileRoute, redirect } from "@tanstack/react-router";

/** Challenge lives on the home page now (ported from pinkypromise.grok.me). */
export const Route = createFileRoute("/challenge/")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
