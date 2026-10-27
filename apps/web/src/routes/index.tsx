import { createFileRoute } from "@tanstack/react-router";
import { FounderTest } from "@/components/founder-test";

export const Route = createFileRoute("/")({ component: Home });

/** Home is the grok.me founder test — start here. */
function Home() {
  return (
    <div className="min-h-screen bg-ink">
      <FounderTest />
    </div>
  );
}
