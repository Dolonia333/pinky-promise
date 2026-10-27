import { createFileRoute, Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/pinky-ui";

export const Route = createFileRoute("/legal/$page")({ component: Legal });

const PAGES: Record<string, { title: string; body: string[] }> = {
  privacy: {
    title: "Privacy",
    body: [
      "We collect a name, a background, and the scores you approve. No resumes, no social profiles, no chat histories.",
      "The analyzer never uploads prompts, code, file paths, commands, or commit messages. Session files stay on your machine.",
      "A report is private to the two people in it. A program view shows pairings and match counts, not individual scores.",
      "There is no audio and no video. The challenge board records actions, not the conversation.",
      "You can delete your account's data from Settings. That removes profiles, codes, invites, reports you were in, and challenge logs.",
    ],
  },
  data: {
    title: "Data handling",
    body: [
      "Before anything uploads, you see the payload and type yes. Each upload is its own row. Nothing is replaced silently.",
      "Teammates in a shared repo are not uploaded. No names, emails, or their commits.",
      "Self-reported answers are weak evidence. Live behavior outranks them.",
      "The narrative is written from the numbers by rules. The model does not invent a score.",
      "Upload codes expire in 15 minutes. Share links expire in 7 days and work once.",
    ],
  },
  terms: {
    title: "Terms",
    body: [
      "Pinky Promise is evidence for a conversation. It is not a verdict on who you should start a company with.",
      "A determined person can behave well for 15 minutes. That is why a trial is a first step toward a longer trial.",
      "Don't run the command on an employer's code. Personal machines and personal projects only.",
      "You may not use the report to rank people, publish a leaderboard, or share it unless both of you agree.",
    ],
  },
};

function Legal() {
  const { page } = Route.useParams();
  const doc = PAGES[page];
  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-6">
      <Wordmark />
      {doc ? (
        <>
          <h1 className="mt-8 font-display text-4xl italic">{doc.title}</h1>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-dust">
            {doc.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-8">That page isn't here.</p>
      )}
      <p className="mt-8 flex gap-4 text-sm">
        <Link to="/legal/$page" params={{ page: "privacy" }}>
          Privacy
        </Link>
        <Link to="/legal/$page" params={{ page: "data" }}>
          Data
        </Link>
        <Link to="/legal/$page" params={{ page: "terms" }}>
          Terms
        </Link>
      </p>
    </main>
  );
}
