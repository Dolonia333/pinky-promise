import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Check, Copy, House, Timer, UserRound, Users } from "lucide-react";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  AREA_KEYS,
  SCORE_KEYS,
  SCORE_LABEL,
  areaWord,
  type AreaKey,
  type Background,
  type ScoreKey,
  type Scores,
} from "@/lib/pinky/types";

export function Mark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--color-raised)" />
      <circle cx="13" cy="16" r="6" fill="none" stroke="var(--color-cream)" strokeWidth="1.6" />
      <circle cx="19" cy="16" r="6" fill="none" stroke="var(--color-seal)" strokeWidth="1.6" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2 text-cream">
      <Mark />
      <span className="font-display text-lg italic">Pinky Promise</span>
    </Link>
  );
}

const NAV = [
  { to: "/studio", label: "Home", icon: House },
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/challenge", label: "Trial", icon: Timer },
  { to: "/program", label: "Room", icon: Users },
] as const;

export function Shell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const { user, isPending } = useCurrentUserState();
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (isPending) {
    return (
      <div className="min-h-screen bg-ink px-5 pt-16">
        <div className="mx-auto h-8 w-40 animate-pulse rounded-full bg-raised" />
        <div className="mx-auto mt-8 h-40 max-w-xl animate-pulse rounded-card bg-paper" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  return (
    <div className="min-h-screen bg-ink pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-ink/90 px-4 py-3 backdrop-blur">
        <Wordmark />
        <div className="flex items-center gap-4">
          <Link to="/settings" className="text-sm text-dust">
            Feedback
          </Link>
          <UserButton />
        </div>
      </header>
      <main className={`mx-auto w-full px-4 pt-5 ${wide ? "max-w-3xl" : "max-w-xl"}`}>{children}</main>
      <nav
        className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-ink/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto grid max-w-xl grid-cols-4">
          {NAV.map((item) => {
            const active = path === item.to || (item.to !== "/studio" && path.startsWith(item.to));
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 text-xs ${active ? "text-cream" : "text-dust"}`}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function useLoad<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancel = false;
    setLoading(true);
    load()
      .then((value) => {
        if (!cancel) {
          setData(value);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancel) {
          setError(err instanceof Error ? err.message : "Something failed.");
          setLoading(false);
        }
      });
    return () => {
      cancel = true;
    };
  }, deps);
  return { data, error, loading, reload: () => setData(null) };
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-card border border-line bg-paper p-4 ${className}`}>{children}</section>;
}

export function Primary({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-seal px-4 py-3 text-sm font-medium text-seal-ink disabled:opacity-50 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function Ghost({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line px-4 py-3 text-sm text-cream disabled:opacity-50 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-3 text-sm text-cream"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setDone(true);
          window.setTimeout(() => setDone(false), 1400);
        });
      }}
    >
      {done ? <Check className="size-4" /> : <Copy className="size-4" />}
      {done ? "Copied" : label}
    </button>
  );
}

export function ScoreBars({ scores, confidence }: { scores: Scores; confidence: Record<ScoreKey, string> }) {
  return (
    <ul className="space-y-3">
      {SCORE_KEYS.map((key) => {
        const value = scores[key];
        return (
          <li key={key}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span>{SCORE_LABEL[key]}</span>
              <span className="text-dust">{value === null ? "Not enough data" : `${value} · ${confidence[key]}`}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-raised">
              <div className="h-full rounded-full bg-seal" style={{ width: `${value ?? 0}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function Areas({ areas, background }: { areas: Partial<Record<AreaKey, number>>; background: Background }) {
  return (
    <ul className="grid grid-cols-2 gap-2">
      {AREA_KEYS.map((key) => (
        <li key={key} className="rounded-2xl bg-raised px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-dust">{areaWord(key, background)}</p>
          <p className="font-display text-xl">{Math.round((areas[key] ?? 0) * 100)}%</p>
        </li>
      ))}
    </ul>
  );
}

export function Hours({ hours }: { hours: number[] }) {
  const max = Math.max(1, ...hours);
  return (
    <div className="flex h-12 items-end gap-0.5" aria-hidden="true">
      {hours.map((value, hour) => (
        <div
          key={hour}
          className="flex-1 rounded-sm bg-seal"
          style={{ height: `${Math.max(8, (value / max) * 100)}%`, opacity: value ? 0.95 : 0.25 }}
        />
      ))}
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-relaxed text-dust">{children}</p>;
}
