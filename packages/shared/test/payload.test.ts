import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { payloadSchema, samplePartnerPayload, samplePayload } from "../src";

const sampleJson = JSON.parse(readFileSync(new URL("../sample-payload.json", import.meta.url), "utf8"));

describe("payload schema", () => {
  it("accepts both sample payloads", () => {
    expect(payloadSchema.parse(samplePayload)).toEqual(samplePayload);
    expect(payloadSchema.parse(samplePartnerPayload)).toEqual(samplePartnerPayload);
  });

  it("keeps the committed JSON sample in sync", () => {
    expect(sampleJson).toEqual(samplePayload);
  });

  it("rejects any field outside the contract", () => {
    const withPrompt = { ...samplePayload, notes: "fix the login bug" };
    expect(payloadSchema.safeParse(withPrompt).success).toBe(false);

    const withPath = { ...samplePayload, signals: { ...samplePayload.signals, topFile: "src/app.tsx" } };
    expect(payloadSchema.safeParse(withPath).success).toBe(false);
  });

  it("rejects out of range values", () => {
    const badRate = { ...samplePayload, signals: { ...samplePayload.signals, testFixRate: 1.4 } };
    expect(payloadSchema.safeParse(badRate).success).toBe(false);

    const badHours = { ...samplePayload, signals: { ...samplePayload.signals, activeHours: [1, 2, 3] } };
    expect(payloadSchema.safeParse(badHours).success).toBe(false);
  });
});
