import { createFileRoute, Link } from "@tanstack/react-router";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { Wordmark } from "@/components/pinky-ui";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div className="min-h-screen bg-ink">
      <header className="flex items-center justify-between px-4 py-4">
        <Wordmark />
        <SignedIn>
          <Link to="/studio" className="text-sm text-cream">
            Open
          </Link>
        </SignedIn>
        <SignedOut>
          <Link to="/login" className="text-sm text-cream">
            Sign in
          </Link>
        </SignedOut>
      </header>
      <main className="mx-auto max-w-xl px-4 pb-16 pt-8">
        <p className="text-xs uppercase tracking-widest text-seal">Co-founder trials</p>
        <h1 className="mt-3 font-display text-5xl italic text-cream">Find out before you pinky promise.</h1>
        <p className="mt-5 text-lg text-dust">
          Co-founder conflict kills startups. People still pick partners from self-written profiles. Pinky Promise
          matches founders on evidence of how they actually build.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <SignedIn>
            <Link
              to="/studio"
              className="inline-flex min-h-11 items-center rounded-full bg-seal px-5 text-sm font-medium text-seal-ink"
            >
              Continue
            </Link>
          </SignedIn>
          <SignedOut>
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center rounded-full bg-seal px-5 text-sm font-medium text-seal-ink"
            >
              Get started
            </Link>
          </SignedOut>
          <Link
            to="/legal/$page"
            params={{ page: "privacy" }}
            className="inline-flex min-h-11 items-center rounded-full border border-line px-5 text-sm text-cream"
          >
            What leaves your machine
          </Link>
        </div>
        <p className="mt-4 text-sm text-dust">Only scores and timings. Never code, prompts, paths, or secrets.</p>

        <ol className="mt-12 space-y-4">
          {[
            [
              "One command",
              "It reads git history and AI coding sessions on your laptop. Nothing is installed for good.",
            ],
            ["You approve the numbers", "The command prints the exact payload and waits until you type yes."],
            [
              "Then the other person",
              "Share a link. The report says where you cover each other and where pace will fight.",
            ],
          ].map(([title, body], index) => (
            <li key={title} className="rounded-card border border-line bg-paper p-4">
              <p className="text-xs text-seal">0{index + 1}</p>
              <h2 className="mt-1 font-display text-2xl">{title}</h2>
              <p className="mt-1 text-sm text-dust">{body}</p>
            </li>
          ))}
        </ol>

        <figure className="mt-10 border-t border-line pt-8">
          <p className="font-display text-6xl text-seal">65%</p>
          <figcaption className="mt-2 text-dust">
            of high-potential startups fail from co-founder conflict, in the research people cite from Noam Wasserman.
            The way people still choose is a coffee chat.
          </figcaption>
        </figure>

        <div className="mt-10 space-y-3 text-sm">
          <p className="text-dust">Self-written matching sites can't show how two people collaborate.</p>
          <p className="text-dust">
            A portrait of one developer can't say anything about a pair, or about a business founder.
          </p>
          <p>Pinky Promise is the comparison. A 15-minute challenge scores business founders on the same dimensions.</p>
        </div>
      </main>
      <footer className="mx-auto flex max-w-xl flex-wrap gap-4 px-4 pb-10 text-sm text-dust">
        <Link to="/legal/$page" params={{ page: "privacy" }}>
          Privacy
        </Link>
        <Link to="/legal/$page" params={{ page: "data" }}>
          Data handling
        </Link>
        <Link to="/legal/$page" params={{ page: "terms" }}>
          Terms
        </Link>
        <Link to="/settings">Feedback</Link>
      </footer>
    </div>
  );
}
