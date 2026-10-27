import { writeFile } from "node:fs/promises";
import type { Payload } from "@pinky-promise/shared";

export const UPLOAD_CODE = /^PP-[A-Z0-9]{4}$/;

export class UploadError extends Error {}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function uploadProfile(apiUrl: string, code: string, payload: Payload): Promise<string> {
  let response: Response;
  try {
    response = await fetch(new URL("/profiles", apiUrl), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, payload }),
    });
  } catch {
    throw new UploadError(`Couldn't reach ${apiUrl}. Check your connection and try again.`);
  }

  if (response.status === 401 || response.status === 403 || response.status === 410) {
    throw new UploadError("That upload code is invalid or expired. Get a new one on the website and run this again.");
  }
  if (!response.ok) throw new UploadError(`Upload failed (${response.status}). Nothing was saved.`);

  const body = (await response.json()) as { url?: string; id?: string };
  if (body.url) return body.url;
  if (body.id) return new URL(`/profiles/${body.id}`, apiUrl).toString();
  throw new UploadError("The server accepted the upload but didn't return a profile link.");
}

export async function saveProfile(path: string, payload: Payload): Promise<void> {
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}
