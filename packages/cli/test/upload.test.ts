import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { samplePayload } from "@pinky-promise/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { UPLOAD_CODE, normalizeCode, uploadProfile } from "../src/upload";

let server: Server;
let apiUrl: string;
let received: unknown;

beforeAll(async () => {
  server = createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", () => {
      received = JSON.parse(body);
      const { code } = received as { code: string };
      if (code !== "PP-7F3K") {
        response.writeHead(401).end();
        return;
      }
      response.writeHead(201, { "content-type": "application/json" }).end(JSON.stringify({ id: "abc123" }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  apiUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => server.close());

describe("uploadProfile", () => {
  it("sends the code and payload and returns the profile link", async () => {
    expect(await uploadProfile(apiUrl, "PP-7F3K", samplePayload)).toBe(`${apiUrl}/profiles/abc123`);
    expect(received).toEqual({ code: "PP-7F3K", payload: samplePayload });
  });

  it("explains an expired code", async () => {
    await expect(uploadProfile(apiUrl, "PP-0000", samplePayload)).rejects.toThrow(/invalid or expired/);
  });

  it("explains when the server is unreachable", async () => {
    await expect(uploadProfile("http://127.0.0.1:1", "PP-7F3K", samplePayload)).rejects.toThrow(/Couldn't reach/);
  });
});

describe("upload codes", () => {
  it("accepts pasted codes in any case", () => {
    expect(UPLOAD_CODE.test(normalizeCode(" pp-7f3k "))).toBe(true);
    expect(UPLOAD_CODE.test(normalizeCode("7F3K"))).toBe(false);
  });
});
