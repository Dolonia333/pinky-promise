import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ARCHETYPES,
  AXIS_WORD,
  AXES,
  POLE_WORD,
  complementaryArchetype,
  frictionPoints,
  groupById,
} from "@/lib/pinky/founder-quiz";

export const Route = createFileRoute("/types/$id")({
  component: TypePage,
  loader: ({ params }) => {
    const type = ARCHETYPES.find((item) => item.id === params.id);
    if (!type) throw notFound();
    return { type };
  },
});

function TypePage() {
  const { type } = Route.useLoaderData();
  const group = groupById(type.group);
  const partner = complementaryArchetype(type);
  const frictions = frictionPoints(type);

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg px-5 py-8">
      <header className="flex items-center justify-between gap-3 text-sm text-dust">
        <Link to="/" className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-seal" aria-hidden="true" />
          Pinky Promise
        </Link>
        <Link to="/types" className="text-seal">
          All types
        </Link>
      </header>

      <p className="mt-10 text-xs font-medium uppercase tracking-widest text-seal">{group.title}</p>
      <h1 className="mt-3 font-display text-4xl italic text-cream">{type.synonym}</h1>
      <p className="mt-2 text-dust">Also called {type.name}</p>
      <p className="mt-4 text-lg text-cream">{type.plain}</p>

      <h2 className="mt-10 font-display text-2xl text-cream">Your four splits</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {AXES.map((axis) => (
          <li key={axis} className="flex justify-between gap-3 border-b border-line py-2">
            <span className="text-dust">{AXIS_WORD[axis]}</span>
            <span className="text-cream">{POLE_WORD[type.poles[axis]]}</span>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 font-display text-2xl text-cream">Strengths</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-dust">
        {type.strengths.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <h2 className="mt-10 font-display text-2xl text-cream">Blind spots</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-dust">
        {type.blinds.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <h2 className="mt-10 font-display text-2xl text-cream">The co-founder you need</h2>
      <p className="mt-3 text-dust">{type.need}</p>
      <Link
        to="/types/$id"
        params={{ id: partner.id }}
        className="mt-3 block rounded-card border border-seal/40 bg-paper px-3 py-3"
      >
        <p className="text-sm text-seal">Strong complement</p>
        <p className="font-display text-2xl italic text-cream">{partner.synonym}</p>
        <p className="text-sm text-dust">{partner.plain}</p>
      </Link>

      <h2 className="mt-10 font-display text-2xl text-cream">Where you&apos;ll clash</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-dust">
        {frictions.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <Link
        to="/"
        className="mt-10 inline-flex min-h-12 items-center justify-center rounded-card bg-seal px-4 font-medium text-seal-ink"
      >
        Take the test
      </Link>
    </main>
  );
}
