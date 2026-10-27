import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Areas, Card, Hours, Note, ScoreBars, Shell } from "@/components/pinky-ui";
import { getStudio, rateProfile } from "@/lib/pinky/fns";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const [studio, setStudio] = useState<Awaited<ReturnType<typeof getStudio>> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancel = false;
    getStudio()
      .then((value) => {
        if (!cancel) setStudio(value);
      })
      .catch((err: unknown) => {
        if (!cancel) setError(err instanceof Error ? err.message : "Failed");
      });
    return () => {
      cancel = true;
    };
  }, []);

  const profile = studio?.profile;
  return (
    <Shell>
      {!profile && !error ? <div className="h-40 animate-pulse rounded-card bg-paper" /> : null}
      {error ? <p className="text-sm text-seal">{error}</p> : null}
      {studio && !profile ? (
        <Card>
          <h1 className="font-display text-3xl italic">No profile yet</h1>
          <Note>Load the sample, paste a payload, or finish the challenge.</Note>
          <Link to="/studio" className="mt-3 inline-flex min-h-11 items-center text-sm">
            Go to the studio
          </Link>
        </Card>
      ) : null}
      {profile ? (
        <div className="space-y-4">
          {profile.demo ? (
            <p className="rounded-2xl border border-line bg-raised px-3 py-2 text-sm text-dust">
              This is the shared sample payload, not your machine. Replace it by running the command.
            </p>
          ) : null}
          <p className="text-xs uppercase tracking-widest text-seal">{profile.background}</p>
          <h1 className="font-display text-5xl italic">{profile.archetype.name}</h1>
          <p className="text-lg text-dust">{profile.archetype.line}</p>
          <Card>
            <h2 className="font-display text-2xl">The co-founder you need</h2>
            <p className="mt-2 text-sm leading-relaxed">{profile.cofounderNeed}</p>
          </Card>
          <Card>
            <h2 className="font-display text-2xl">How to work with me</h2>
            <ul className="mt-3 space-y-2 text-sm text-dust">
              {profile.workWithMe.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="font-display text-2xl">Scores</h2>
            <div className="mt-4">
              <ScoreBars scores={profile.scores} confidence={profile.confidence} />
            </div>
            <ul className="mt-4 space-y-2 text-sm text-dust">
              {profile.evidence.map((line) => (
                <li key={line.key}>{line.detail}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="font-display text-2xl">Where the work sits</h2>
            <div className="mt-3">
              <Areas areas={profile.signals.areas} background={profile.background} />
            </div>
            <p className="mt-4 text-xs uppercase tracking-wide text-dust">Hours you were active</p>
            <div className="mt-2">
              <Hours hours={profile.signals.activeHours} />
            </div>
            <p className="mt-3 text-xs text-dust">
              {profile.counts.sessions} sessions · {profile.counts.commits} commits · {profile.counts.repos} repos
              {profile.uploadCount > 1 ? ` · ${profile.uploadCount} uploads combined` : ""}
            </p>
          </Card>
          <Card>
            <h2 className="font-display text-2xl">Does this sound like you?</h2>
            <div className="mt-3 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`min-h-11 min-w-11 rounded-full border ${profile.rating === n ? "border-seal bg-seal text-seal-ink" : "border-line"}`}
                  onClick={() => {
                    void rateProfile({ data: n }).then(() =>
                      setStudio((prev) =>
                        prev && prev.profile ? { ...prev, profile: { ...prev.profile, rating: n } } : prev,
                      ),
                    );
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <Note>1 is wrong. 5 is exact. We report the number as it comes out.</Note>
          </Card>
          <Link
            to="/compare"
            className="inline-flex min-h-11 items-center rounded-full bg-seal px-4 text-sm font-medium text-seal-ink"
          >
            Compare with someone
          </Link>
        </div>
      ) : null}
    </Shell>
  );
}
