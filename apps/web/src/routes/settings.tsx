import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card, Note, Primary, Shell } from "@/components/pinky-ui";
import { deleteMyData, sendFeedback } from "@/lib/pinky/fns";

export const Route = createFileRoute("/settings")({ component: Settings });

function Settings() {
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [body, setBody] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  return (
    <Shell>
      <h1 className="font-display text-4xl italic">Settings</h1>
      <Card className="mt-4">
        <h2 className="font-display text-2xl">Feedback</h2>
        <Note>On every page, this is the door. It saves to your account.</Note>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="mt-3 w-full rounded-2xl border border-line bg-ink px-3 py-2 text-sm"
          placeholder="What was confusing?"
        />
        <Primary
          className="mt-3"
          onClick={() => {
            setError("");
            void sendFeedback({ data: { page: "settings", body } })
              .then(() => {
                setBody("");
                setNote("Saved.");
              })
              .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed"));
          }}
        >
          Send
        </Primary>
        {note ? <p className="mt-2 text-sm text-dust">{note}</p> : null}
        {error ? <p className="mt-2 text-sm text-seal">{error}</p> : null}
      </Card>
      <Card className="mt-3">
        <h2 className="font-display text-2xl">Delete my data</h2>
        <Note>
          Profiles, upload codes, invites, reports you were in, challenges, and feedback. The other person's own profile
          stays.
        </Note>
        {confirm ? (
          <Primary
            className="mt-3"
            onClick={() => {
              void deleteMyData().then(() => navigate({ to: "/studio" }));
            }}
          >
            Yes, delete everything
          </Primary>
        ) : (
          <button type="button" className="mt-3 min-h-11 text-sm text-seal" onClick={() => setConfirm(true)}>
            Delete my data
          </button>
        )}
      </Card>
    </Shell>
  );
}
