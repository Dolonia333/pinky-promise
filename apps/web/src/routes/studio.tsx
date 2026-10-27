import { useEffect, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Card, CopyButton, Ghost, Note, Primary, Shell } from "@/components/pinky-ui";
import { getStudio, issueUploadCode, pastePayload, useSampleProfile } from "@/lib/pinky/fns";

export const Route = createFileRoute("/studio")({ component: Studio });

const COMMAND = "npx pinky-promise-cli analyze";

function remaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

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
  const [left, setLeft] = useState("");
  useEffect(() => {
    if (!active) return;
    const tick = () => setLeft(remaining(active.expiresAt));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [active]);

  return (
    <Shell>
      <p className="text-xs uppercase tracking-widest text-seal">Studio</p>
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
        <Note>No profile yet. Run the command, take the challenge, or load the sample to look around.</Note>
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
              <p className="text-xs text-dust">{left || "15:00"} left</p>
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
            Ran the command with --json? Paste what it printed. It has to match the upload format and needs a live code.
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
            Made-up numbers, not your history. Use it to see what a profile and a pair report look like.
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
          <h2 className="font-display text-2xl">Pick your way in</h2>
          <ul className="mt-3 space-y-3 text-sm">
            <li className="rounded-2xl bg-raised px-3 py-3">
              <p className="text-cream">You write code</p>
              <p className="mt-1 text-dust">Run the command above. Git and AI coding sessions stay on your machine.</p>
            </li>
            <li className="rounded-2xl bg-raised px-3 py-3">
              <p className="text-cream">You use ChatGPT or Claude</p>
              <p className="mt-1 text-dust">Upload an export. The file never leaves the browser.</p>
              <Link to="/history" className="mt-2 inline-flex min-h-11 items-center text-seal">
                Upload AI history
              </Link>
            </li>
            <li className="rounded-2xl bg-raised px-3 py-3">
              <p className="text-cream">Neither — scenes instead</p>
              <p className="mt-1 text-dust">Twenty-four founder scenes. Sixteen types. No coding history needed.</p>
              <Link to="/" className="mt-2 inline-flex min-h-11 items-center text-seal">
                Take the founder test
              </Link>
            </li>
          </ul>
        </Card>
      </div>
    </Shell>
  );
}
