import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ExportError, analyzeExport } from "@pinky-promise/history";
import { TOPIC_LABELS, type Payload, type Topic } from "@pinky-promise/shared";
import { Card, Ghost, Note, Primary, Shell } from "@/components/pinky-ui";
import { getStudio, issueUploadCode, pastePayload } from "@/lib/pinky/fns";

export const Route = createFileRoute("/history")({ component: HistoryUpload });

function HistoryUpload() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [payload, setPayload] = useState<Payload | null>(null);
  const [fileName, setFileName] = useState("");
  const [code, setCode] = useState<{ code: string; expiresAt: string } | null>(null);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    let cancel = false;
    getStudio()
      .then((studio) => {
        if (!cancel && studio.code) setCode(studio.code);
      })
      .catch((err: unknown) => {
        if (!cancel) setError(err instanceof Error ? err.message : "Failed");
      });
    return () => {
      cancel = true;
    };
  }, []);

  async function onFile(file: File | null) {
    if (!file) return;
    setError("");
    setPayload(null);
    setApproved(false);
    setFileName(file.name);
    setBusy("read");
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const next = analyzeExport(bytes);
      setPayload(next);
    } catch (err) {
      if (err instanceof ExportError) setError(err.message);
      else setError(err instanceof Error ? err.message : "Could not read that file.");
    } finally {
      setBusy("");
    }
  }

  async function ensureCode() {
    if (code) return code;
    const next = await issueUploadCode();
    setCode(next);
    return next;
  }

  async function upload() {
    if (!payload || !approved) return;
    setBusy("upload");
    setError("");
    try {
      const live = await ensureCode();
      const result = await pastePayload({
        data: {
          code: live.code,
          json: JSON.stringify(payload),
          background: "business",
        },
      });
      if (!result.ok) throw new Error(result.error);
      await navigate({ to: "/profile" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy("");
    }
  }

  const topics = payload?.signals.topics ?? {};
  const topicRows = (Object.keys(topics) as Topic[])
    .filter((key) => (topics[key] ?? 0) > 0)
    .sort((a, b) => (topics[b] ?? 0) - (topics[a] ?? 0));

  return (
    <Shell>
      <p className="text-xs uppercase tracking-widest text-seal">AI history</p>
      <h1 className="mt-1 font-display text-4xl italic">Upload a ChatGPT or Claude export</h1>
      <Note>
        The file never leaves this browser. We turn it into the same numbers-only profile the command builds, then
        upload only after you approve.
      </Note>
      {error ? <p className="mt-3 text-sm text-seal">{error}</p> : null}

      <Card className="mt-5">
        <h2 className="font-display text-2xl">Pick the export</h2>
        <p className="mt-1 text-sm text-dust">A ChatGPT or Claude zip / JSON export from your account.</p>
        <input
          type="file"
          accept=".zip,.json,application/json,application/zip"
          className="mt-4 block w-full text-sm text-dust file:mr-3 file:rounded-card file:border-0 file:bg-seal file:px-4 file:py-2 file:font-medium file:text-seal-ink"
          disabled={Boolean(busy)}
          onChange={(event) => void onFile(event.target.files?.[0] ?? null)}
        />
        {fileName ? <p className="mt-2 text-xs text-dust">{fileName}</p> : null}
        {busy === "read" ? <p className="mt-2 text-sm text-dust">Reading on this device…</p> : null}
      </Card>

      {payload ? (
        <Card className="mt-3">
          <h2 className="font-display text-2xl">Exactly what would be uploaded</h2>
          <p className="mt-2 text-sm text-dust">
            {payload.counts.sessions} conversations · {payload.window.from} to {payload.window.to} · sources:{" "}
            {payload.sources.join(", ")}
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {(
              [
                ["Planning", payload.scores.planning],
                ["Quality", payload.scores.quality],
                ["Pace", payload.scores.pace],
                ["Exploration", payload.scores.exploration],
                ["Steering", payload.scores.steering],
              ] as const
            ).map(([label, value]) => (
              <li key={label} className="flex justify-between gap-3 border-b border-line py-1">
                <span className="text-dust">{label}</span>
                <span>{value === null ? "Not enough data" : value}</span>
              </li>
            ))}
          </ul>
          {topicRows.length ? (
            <>
              <p className="mt-4 text-xs uppercase tracking-wide text-dust">Topics (instead of frontend / backend)</p>
              <ul className="mt-2 grid grid-cols-2 gap-2">
                {topicRows.map((topic) => (
                  <li key={topic} className="rounded-2xl bg-raised px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-dust">{TOPIC_LABELS[topic]}</p>
                    <p className="font-display text-xl">{Math.round((topics[topic] ?? 0) * 100)}%</p>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <pre className="mt-4 max-h-48 overflow-auto rounded-2xl bg-ink p-3 font-mono text-[11px] text-dust">
            {JSON.stringify(payload, null, 2)}
          </pre>
          <label className="mt-4 flex min-h-11 items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={approved}
              onChange={(event) => setApproved(event.target.checked)}
              className="mt-1"
            />
            <span>Yes — upload only these numbers as a business-founder profile. No file, no prompts.</span>
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <Primary disabled={!approved || Boolean(busy)} onClick={() => void upload()}>
              {busy === "upload" ? "Uploading…" : "Upload numbers"}
            </Primary>
            <Ghost
              onClick={() => {
                setPayload(null);
                setFileName("");
                setApproved(false);
              }}
            >
              Clear
            </Ghost>
          </div>
          {code ? <p className="mt-3 text-xs text-dust">Using upload code {code.code}</p> : null}
        </Card>
      ) : null}

      <p className="mt-6 text-sm text-dust">
        Code on a laptop?{" "}
        <Link to="/studio" className="text-seal">
          Run the command
        </Link>
        . Prefer scenes instead?{" "}
        <Link to="/" className="text-seal">
          Take the founder test
        </Link>
        .
      </p>
    </Shell>
  );
}
