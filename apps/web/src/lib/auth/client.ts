import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const githubSignInEnabled = import.meta.env.VITE_GITHUB_SIGN_IN === "true";

export async function signInWithGitHub(callbackURL = "/studio"): Promise<string | null> {
  const result = await authClient.signIn.social({ provider: "github", callbackURL });
  return result.error ? (result.error.message ?? "GitHub sign-in failed.") : null;
}

export async function signOut(): Promise<void> {
  await authClient.signOut();
  window.location.assign("/");
}
