import { createFileRoute, Link } from "@tanstack/react-router";
import { ARCHETYPES, GROUPS, typesInGroup } from "@/lib/pinky/founder-quiz";

export const Route = createFileRoute("/types/")({ component: TypesIndex });

function TypesIndex() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-lg px-5 py-8">
      <header className="flex items-center justify-between gap-3 text-sm text-dust">
        <Link to="/" className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-seal" aria-hidden="true" />
          Pinky Promise
        </Link>
        <Link to="/" className="text-seal">
          Take the test
        </Link>
      </header>

      <p className="mt-10 text-xs font-medium uppercase tracking-widest text-seal">Founder types</p>
      <h1 className="mt-3 font-display text-4xl italic text-cream">All sixteen</h1>
      <p className="mt-4 text-dust">
        Four groups of four — like{" "}
        <a
          href="https://www.16personalities.com/personality-types"
          className="text-seal underline-offset-2 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          16Personalities
        </a>
        , for how founders actually work.
      </p>

      <div className="mt-8 flex flex-col gap-8">
        {GROUPS.map((group) => (
          <section key={group.id}>
            <h2 className="text-sm font-medium uppercase tracking-wide text-seal">{group.title}</h2>
            <p className="mt-1 text-sm text-dust">{group.plain}</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {typesInGroup(group.id).map((type) => (
                <li key={type.id}>
                  <Link
                    to="/types/$id"
                    params={{ id: type.id }}
                    className="block h-full rounded-card border border-line bg-paper px-3 py-3 hover:bg-raised"
                  >
                    <p className="text-cream">{type.synonym}</p>
                    <p className="text-sm text-dust">{type.name}</p>
                    <p className="mt-2 text-sm text-dust">{type.plain}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-8 text-xs text-dust">{ARCHETYPES.length} types</p>
    </main>
  );
}
