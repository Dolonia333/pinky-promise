import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CopyButton, Note, Primary, Shell } from "@/components/pinky-ui";
import { getStudio } from "@/lib/pinky/fns";

export const Route = createFileRoute("/apply")({ component: ApplyLink });

/** P5 — consented "attach to an application" link. */
function ApplyLink() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancel = false;
    getStudio()
      .then((studio) => {
        if (cancel) return;
        setProfileId(studio.profile && !studio.profile.demo ? studio.profile.id : null);
      })
      .catch((err: unknown) => {
        if (!cancel) setError(err instanceof Error ? err.message : "Failed");
      });
    return () => {
      cancel = true;
    };
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = consent && profileId ? `${origin}/profile?attach=${encodeURIComponent(profileId)}` : "";

  return (
    <Shell>
      <p className="text-xs uppercase tracking-widest text-seal">Applications</p>
      <h1 className="mt-1 font-display text-4xl italic">Attach your profile</h1>
      <Note>
        Only create this link if you want a program or investor to open your Pinky Promise profile with your consent.
        You can revoke access later by deleting your data in Settings.
      </Note>
      {error ? <p className="mt-3 text-sm text-seal">{error}</p> : null}

      {!profileId ? (
        <Card className="mt-5">
          <p className="text-sm text-dust">You need a real profile first (not the sample).</p>
          <Link to="/studio" className="mt-3 inline-flex min-h-11 items-center text-seal">
            Go to the studio
          </Link>
        </Card>
      ) : (
        <Card className="mt-5">
          <label className="flex min-h-11 items-start gap-3 text-sm">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
            <span>
              I consent to attach my Pinky Promise profile to an application. The person with this link can see the same
              report I see on my profile page.
            </span>
          </label>
          {consent ? (
            <div className="mt-4">
              <p className="break-all text-sm text-cream">{link}</p>
              <div className="mt-3">
                <CopyButton text={link} label="Copy attach link" />
              </div>
            </div>
          ) : (
            <Note>Check the box to create the attach link.</Note>
          )}
        </Card>
      )}
    </Shell>
  );
}
