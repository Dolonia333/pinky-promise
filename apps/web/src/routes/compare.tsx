import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, CopyButton, Ghost, Note, Primary, Shell } from "@/components/pinky-ui";
import { getStudio, makeInvite, openMaya } from "@/lib/pinky/fns";

export const Route = createFileRoute("/compare")({ component: Compare });

function Compare() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<{ id: string; otherName: string; headline: string }[]>([]);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let cancel = false;
    getStudio()
      .then((studio) => {
        if (!cancel) setReports(studio.reports);
      })
      .catch((err: unknown) => {
        if (!cancel) setError(err instanceof Error ? err.message : "Failed");
      });
    return () => {
      cancel = true;
    };
  }, []);

  const link = token ? `${window.location.origin}/i/${token}` : "";

  return (
    <Shell>
      <h1 className="font-display text-4xl italic">Compare</h1>
      <Note>A report exists only after both people opt in. Nobody else sees it.</Note>
      {error ? <p className="mt-3 text-sm text-seal">{error}</p> : null}
      <Card className="mt-4">
        <h2 className="font-display text-2xl">Invite</h2>
        <Primary
          className="mt-3"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setError("");
            void makeInvite()
              .then((result) => {
                if (!result.ok) throw new Error(result.error);
                setToken(result.token);
              })
              .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed"))
              .finally(() => setBusy(false));
          }}
        >
          Create a link
        </Primary>
        {link ? (
          <div className="mt-3">
            <p className="break-all text-sm">{link}</p>
            <div className="mt-2">
              <CopyButton text={link} label="Copy invite" />
            </div>
          </div>
        ) : null}
      </Card>
      <Card className="mt-3">
        <h2 className="font-display text-2xl">Sample partner</h2>
        <p className="mt-1 text-sm text-dust">
          Maya Chen is not a real person. She is the complement in the demo: backend and infrastructure, plans, tests,
          slower pace.
        </p>
        <Ghost
          className="mt-3"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void openMaya()
              .then((result) => {
                if (!result.ok) throw new Error(result.error);
                return navigate({ to: "/reports/$id", params: { id: result.reportId } });
              })
              .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed"))
              .finally(() => setBusy(false));
          }}
        >
          Read the report with Maya
        </Ghost>
      </Card>
      <ul className="mt-4 space-y-2">
        {reports.map((report) => (
          <li key={report.id}>
            <Link
              to="/reports/$id"
              params={{ id: report.id }}
              className="block rounded-card border border-line bg-paper p-4"
            >
              <p className="text-sm text-dust">With {report.otherName}</p>
              <p className="mt-1 text-sm">{report.headline}</p>
            </Link>
          </li>
        ))}
      </ul>
    </Shell>
  );
}
