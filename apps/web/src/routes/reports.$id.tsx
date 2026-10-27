import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, Note, Shell } from "@/components/pinky-ui";
import { followUpIcs } from "@/lib/pinky/fit";
import { getReport } from "@/lib/pinky/fns";
import { SCORE_LABEL, type ScoreKey } from "@/lib/pinky/types";

export const Route = createFileRoute("/reports/$id")({ component: ReportPage });

function ReportPage() {
  const { id } = Route.useParams();
  const [report, setReport] = useState<Awaited<ReturnType<typeof getReport>> | undefined>(undefined);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancel = false;
    getReport({ data: id })
      .then((value) => {
        if (!cancel) setReport(value);
      })
      .catch((err: unknown) => {
        if (!cancel) setError(err instanceof Error ? err.message : "Failed");
      });
    return () => {
      cancel = true;
    };
  }, [id]);

  return (
    <Shell>
      {error ? <p className="text-sm text-seal">{error}</p> : null}
      {report === undefined && !error ? <div className="h-48 animate-pulse rounded-card bg-paper" /> : null}
      {report === null ? <p>That report isn't yours.</p> : null}
      {report ? (
        <article className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-seal">{report.archetype}</p>
          <h1 className="font-display text-4xl italic">{report.archetypeLine}</h1>
          <p className="text-lg leading-snug">{report.headline}</p>
          {report.nameB === "Maya Chen" ? (
            <Note>Maya is a sample partner, not a real person. The rules are the same ones a real compare uses.</Note>
          ) : null}
          <Card>
            <h2 className="font-display text-2xl">Where you complement each other</h2>
            <ul className="mt-3 space-y-2 text-sm text-dust">
              {report.complements.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="font-display text-2xl">Where friction is likely</h2>
            <ul className="mt-3 space-y-2 text-sm text-dust">
              {report.frictions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="font-display text-2xl">The session in numbers</h2>
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {report.numbers.map((row) => (
                <li key={row.label} className="rounded-2xl bg-raised px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-dust">
                    {SCORE_LABEL[row.label as ScoreKey] ?? row.label}
                  </p>
                  <p className="font-display text-xl">{row.value}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-dust">
              {report.nameA} / {report.nameB}
            </p>
            <p className="mt-2 text-sm text-dust">{report.confidenceNote}</p>
          </Card>
          <Card>
            <h2 className="font-display text-2xl">Suggested next step</h2>
            <p className="mt-2">{report.nextStep}</p>
            <button
              type="button"
              className="mt-4 min-h-11 rounded-full border border-line px-4 text-sm"
              onClick={() => {
                const ics = followUpIcs(report.id, report.nameA, report.nameB);
                const blob = new Blob([ics], { type: "text/calendar" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "pinky-promise-follow-up.ics";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Add a follow-up to your calendar
            </button>
            <Note>A 45-minute hold, three days out. Both of you can add the same event. This is not a verdict.</Note>
          </Card>
        </article>
      ) : null}
    </Shell>
  );
}
