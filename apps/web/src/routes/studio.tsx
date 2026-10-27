import { useEffect, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Card, CopyButton, Ghost, Note, Primary, Shell } from "@/components/pinky-ui";
import { getStudio, issueUploadCode, pastePayload, useSampleProfile } from "@/lib/pinky/fns";

export const Route = createFileRoute("/studio")({ component: Studio });

const COMMAND = "npx pinky-promise-cli analyze";

function Studio() {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [json, setJson] = useState("");
  const [code, setCode] = useState<{ code: string; expiresAt: string } | null>(null);
  const [studio, setStudio] = useState<Awaited<ReturnType<typeof getStudio>> | null>(null);

  async function refresh() {
    const next = await getStudio();
    setStudio(next);
    if (next.code) setCode(next.code);
  }

  useEffect(() => {
    let cancel = false;
    getStudio()
      .then((next) => {
        if (cancel) return;
        setStudio(next);
        if (next.code) setCode(next.code);
      })
      .catch((err: unknown) => {
        if (!cancel) setError(err instanceof Error ? err.message : "Failed");
      });
    return () => {
      cancel = true;
    };
  }, []);

  async function run(label: string, task: () => Promise<unknown>) {
    setBusy(label);
    setError("");
    try {
      await task();
      await refresh();
      await router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy("");
    }
  }

  const profile = studio?.profile;
  const active = code ?? studio?.code ?? null;

  return (
    <Shell>
      <p className="text-xs uppercase tracking-widest text-seal">Tonight</p>
      <h1 className="mt-1 font-display text-4xl italic">Your builder profile</h1>
      <Note>The command stays on your machine. This page only receives the numbers you approve.</Note>
      {error ? <p className="mt-3 text-sm text-seal">{error}</p> : null}

      {studio && profile ? (
        <Card className="mt-5">
          <p className="text-xs uppercase tracking-wide text-dust">
            {profile.demo ? "Sample, not your machine" : "From your uploads"}
          </p>
          <h2 className="mt-1 font-display text-3xl italic">{profile.archetype.name}</h2>
          <p className="mt-2 text-sm text-dust">{profile.cofounderNeed}</p>
          <Link to="/profile" className="mt-4 inline-flex min-h-11 items-center text-sm text-cream">
            Read the full profile
          </Link>
        </Card>
      ) : studio ? (
        <Note>No profile yet. Use a sample so the demo works tonight, paste a payload, or take the challenge.</Note>
      ) : error ? null : (
        <div className="mt-5 h-28 animate-pulse rounded-card bg-paper" />
      )}

      <div className="mt-4 space-y-3">
        <Card>
          <h2 className="font-display text-2xl">Upload code</h2>
          <p className="mt-1 text-sm text-dust">
            Sign-in for the terminal. Valid 15 minutes. The command asks for it after you type yes.
          </p>
          {active ? (
            <div className="mt-3">
              <p className="font-display text-3xl tracking-wide">{active.code}</p>
              <p className="text-xs text-dust">
                Expires {new Date(active.expiresAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <CopyButton text={active.code} label="Copy code" />
                <CopyButton text={COMMAND} label="Copy command" />
              </div>
              <p className="mt-3 rounded-2xl bg-raised px-3 py-2 font-mono text-xs text-cream">{COMMAND}</p>
            </div>
          ) : (
            <Primary className="mt-3" disabled={Boolean(busy)} onClick={() => run("code", () => issueUploadCode())}>
              Get upload code
            </Primary>
          )}
        </Card>

        <Card>
          <h2 className="font-display text-2xl">Paste a payload</h2>
          <p className="mt-1 text-sm text-dust">
            Until the command is published, paste the JSON it would send. It must match the agreed shape, and it needs a
            live code.
          </p>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            rows={5}
            placeholder='{"analyzerVersion":"0.1.0", ...}'
            className="mt-3 w-full rounded-2xl border border-line bg-ink px-3 py-2 font-mono text-xs text-cream"
          />
          <Primary
            className="mt-3"
            disabled={!active || !json.trim() || Boolean(busy)}
            onClick={() =>
              run("paste", async () => {
                const result = await pastePayload({ data: { code: active?.code ?? "", json } });
                if (!result.ok) throw new Error(result.error);
                setJson("");
              })
            }
          >
            Upload numbers
          </Primary>
        </Card>

        <Card>
          <h2 className="font-display text-2xl">Sample, clearly labeled</h2>
          <p className="mt-1 text-sm text-dust">
            The shared test payload from the plan. It is not your git history. Judges can see a profile before the
            command exists.
          </p>
          <Ghost
            className="mt-3"
            disabled={Boolean(busy)}
            onClick={() =>
              run("sample", () =>
                useSampleProfile().then((r) => {
                  if (!r.ok) throw new Error(r.error);
                }),
              )
            }
          >
            Load the sample
          </Ghost>
        </Card>

        <Card>
          <h2 className="font-display text-2xl">No coding sessions?</h2>
          <p className="mt-1 text-sm text-dust">
            Business founders take a 15-minute challenge. Same five dimensions. Actions, not writing polish.
          </p>
          <Link to="/challenge" className="mt-3 inline-flex min-h-11 items-center text-sm text-cream">
            Start the challenge
          </Link>
        </Card>
      </div>
    </Shell>
  );
}
