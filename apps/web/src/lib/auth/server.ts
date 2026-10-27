import { randomBytes } from "node:crypto";
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { Pool } from "pg";
import { ensureDbReady, getPglite } from "../db";
import { env } from "../env.server";
import { pgliteDialect } from "./pglite-dialect";

const LOCAL_ORIGINS = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:8082",
  "http://127.0.0.1:8082",
];

const databaseUrl = env("DATABASE_URL");
const configuredSecret = env("BETTER_AUTH_SECRET");
const baseURL = env("BETTER_AUTH_URL") ?? LOCAL_ORIGINS[0];
const githubClientId = env("GITHUB_CLIENT_ID");
const githubClientSecret = env("GITHUB_CLIENT_SECRET");

if (databaseUrl && !configuredSecret) {
  throw new Error("Set BETTER_AUTH_SECRET before connecting to a real database.");
}

const globalRef = globalThis as typeof globalThis & { __localAuthSecret__?: string };

function localSecret(): string {
  globalRef.__localAuthSecret__ ??= randomBytes(32).toString("hex");
  return globalRef.__localAuthSecret__;
}

if (!databaseUrl) void ensureDbReady();

export const githubConfigured = Boolean(githubClientId && githubClientSecret);

export const auth = betterAuth({
  baseURL,
  secret: configuredSecret ?? localSecret(),
  database: databaseUrl
    ? new Pool({ connectionString: databaseUrl })
    : { dialect: pgliteDialect(() => getPglite()), type: "postgres" as const },
  trustedOrigins: [...new Set([baseURL, ...LOCAL_ORIGINS])],
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  socialProviders: githubConfigured
    ? { github: { clientId: githubClientId as string, clientSecret: githubClientSecret as string } }
    : {},
  account: { encryptOAuthTokens: true },
  session: { cookieCache: { enabled: true, maxAge: 300 } },
  plugins: [tanstackStartCookies()],
});
