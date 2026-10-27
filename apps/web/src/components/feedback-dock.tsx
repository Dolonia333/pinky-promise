import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { sendFeedback } from "@/lib/pinky/fns";

/** Feedback entry on every authenticated page (P7). */
export function FeedbackDock() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-20 min-h-11 rounded-full border border-line bg-paper px-4 text-sm text-cream shadow-lg sm:bottom-6"
      >
        Feedback
      </button>
    );
  }

  return (
    <div className="fixed inset-x-4 bottom-20 z-20 mx-auto max-w-md rounded-card border border-line bg-paper p-4 shadow-lg sm:bottom-6 sm:inset-x-auto sm:right-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-xl italic">Feedback</p>
        <button type="button" className="text-sm text-dust" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
      <p className="mt-1 text-xs text-dust">Saved to your account from {path}</p>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={3}
        className="mt-3 w-full rounded-2xl border border-line bg-ink px-3 py-2 text-sm"
        placeholder="What was confusing?"
      />
      <button
        type="button"
        disabled={busy}
        className="mt-3 min-h-11 w-full rounded-card bg-seal px-4 font-medium text-seal-ink disabled:opacity-40"
        onClick={() => {
          setBusy(true);
          setError("");
          setNote("");
          void sendFeedback({ data: { page: path, body } })
            .then(() => {
              setBody("");
              setNote("Saved.");
            })
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed"))
            .finally(() => setBusy(false));
        }}
      >
        Send
      </button>
      {note ? <p className="mt-2 text-sm text-dust">{note}</p> : null}
      {error ? <p className="mt-2 text-sm text-seal">{error}</p> : null}
    </div>
  );
}
