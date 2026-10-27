import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/qr")({ component: QrPage });

/** A7 — short public entry + QR that opens the landing / founder test. */
function QrPage() {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://pinkypromise.local";
  const target = `${origin}/`;
  const shortPath = `${origin}/go`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=12&data=${encodeURIComponent(target)}`;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 py-8">
      <header className="flex items-center gap-2 text-sm text-dust">
        <span className="size-2.5 rounded-full bg-seal" aria-hidden="true" />
        Pinky Promise
      </header>
      <p className="mt-10 text-xs font-medium uppercase tracking-widest text-seal">Share</p>
      <h1 className="mt-3 font-display text-4xl italic text-cream">Short link + QR</h1>
      <p className="mt-4 text-dust">
        Print this or put it on a slide. It opens the founder test — no sign-in required.
      </p>
      <p className="mt-4 break-all font-mono text-sm text-cream">{shortPath}</p>
      <p className="mt-1 text-xs text-dust">
        Alias of <span className="text-cream">{target}</span>
      </p>
      <img
        src={qrSrc}
        alt="QR code linking to Pinky Promise"
        width={280}
        height={280}
        className="mt-8 rounded-card border border-line bg-cream p-3"
      />
      <Link
        to="/"
        className="mt-8 inline-flex min-h-12 items-center justify-center rounded-card bg-seal px-4 font-medium text-seal-ink"
      >
        Open the test
      </Link>
    </main>
  );
}
