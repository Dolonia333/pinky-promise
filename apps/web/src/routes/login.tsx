import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GROK_PROVIDERS, authClient, signIn } from "@/lib/auth/client";
import { Wordmark } from "@/components/pinky-ui";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    const result =
      mode === "up"
        ? await authClient.signUp.email({ email, password, name, callbackURL: "/studio" })
        : await authClient.signIn.email({ email, password, callbackURL: "/studio" });
    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "Could not sign in.");
      return;
    }
    await navigate({ to: "/studio" });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-8">
      <Wordmark />
      <h1 className="mt-10 font-display text-4xl italic">Sign in to keep your profile.</h1>
      <p className="mt-3 text-sm text-dust">Email is the backup. Google and X work too. No anonymous rooms.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-3">
        {mode === "up" ? (
          <label className="block text-sm">
            Name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-line bg-paper px-3 py-3 text-cream"
              autoComplete="name"
            />
          </label>
        ) : null}
        <label className="block text-sm">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-line bg-paper px-3 py-3 text-cream"
            autoComplete="email"
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-line bg-paper px-3 py-3 text-cream"
            autoComplete={mode === "up" ? "new-password" : "current-password"}
          />
        </label>
        {error ? <p className="text-sm text-seal">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 w-full rounded-full bg-seal text-sm font-medium text-seal-ink disabled:opacity-50"
        >
          {pending ? "Working…" : mode === "up" ? "Create account" : "Sign in"}
        </button>
        <button
          type="button"
          className="min-h-11 w-full text-sm text-dust"
          onClick={() => setMode(mode === "up" ? "in" : "up")}
        >
          {mode === "up" ? "I already have an account" : "Need an account?"}
        </button>
      </form>
      <div className="mt-6 space-y-2">
        {GROK_PROVIDERS.map((provider) => (
          <button
            key={provider.providerId}
            type="button"
            className="min-h-11 w-full rounded-full border border-line text-sm"
            onClick={() => signIn(provider.providerId, { callbackURL: "/studio" })}
          >
            Continue with {provider.label}
          </button>
        ))}
      </div>
    </main>
  );
}
