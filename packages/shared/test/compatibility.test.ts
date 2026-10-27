import { describe, expect, it } from "vitest";
import { compareFounders, hoursOverlap, samplePartnerPayload, samplePayload, type Payload } from "../src";

function founder(name: string, scores: Payload["scores"], areas: Payload["signals"]["areas"]) {
  return { name, payload: { ...samplePayload, scores, signals: { ...samplePayload.signals, areas } } };
}

describe("hoursOverlap", () => {
  it("is 1 for identical schedules and 0 for opposite ones", () => {
    const day = [...Array(12).fill(0), ...Array(12).fill(5)];
    const night = [...Array(12).fill(5), ...Array(12).fill(0)];
    expect(hoursOverlap(day, day)).toBe(1);
    expect(hoursOverlap(day, night)).toBe(0);
    expect(hoursOverlap(day, Array(24).fill(0))).toBeNull();
  });
});

describe("compareFounders", () => {
  it("is symmetric in what it finds", () => {
    const a = { name: "Maya", payload: samplePayload };
    const b = { name: "Jordan", payload: samplePartnerPayload };
    const forward = compareFounders(a, b);
    const backward = compareFounders(b, a);
    expect(forward.complements.length).toBe(backward.complements.length);
    expect(forward.frictions.length).toBe(backward.frictions.length);
    expect(forward.archetype).toEqual(backward.archetype);
  });

  it("spots complementary areas and a pace risk", () => {
    const report = compareFounders(
      founder(
        "Maya",
        { planning: 80, quality: 75, pace: 30, exploration: 70, steering: 60 },
        { backend: 0.6, infra: 0.4 },
      ),
      founder(
        "Jordan",
        { planning: 20, quality: 35, pace: 90, exploration: 40, steering: 50 },
        { frontend: 0.9, data: 0.1 },
      ),
    );
    expect(report.archetype.name).toBe("Rocket and Brakes");
    expect(report.headline).toBe(
      "You cover each other's gaps: Maya on backend and infrastructure, Jordan on frontend. Your biggest risk is pace.",
    );
    expect(report.complements[0]).toBe("Maya covers backend and infrastructure; Jordan covers frontend.");
    expect(report.frictions.some((line) => line.includes("ships much faster"))).toBe(true);
  });

  it("warns when both share the same gap", () => {
    const report = compareFounders(
      founder(
        "Sam",
        { planning: 50, quality: 20, pace: 60, exploration: 50, steering: 50 },
        { frontend: 0.5, backend: 0.5 },
      ),
      founder(
        "Ari",
        { planning: 55, quality: 25, pace: 62, exploration: 52, steering: 48 },
        { frontend: 0.5, backend: 0.5 },
      ),
    );
    expect(report.archetype.name).toBe("Mirror Match");
    expect(report.frictions[0]).toBe(
      "Neither of you is someone who writes tests and catches what breaks. Decide who owns it.",
    );
    expect(report.headline).toContain("Your biggest risk is how much to test.");
  });

  it("reports the weakest evidence behind the comparison", () => {
    const thin = { ...samplePartnerPayload, confidence: { ...samplePartnerPayload.confidence, pace: "weak" as const } };
    expect(compareFounders({ name: "A", payload: samplePayload }, { name: "B", payload: thin }).confidence).toBe(
      "weak",
    );
  });
});

describe("business founders", () => {
  it("uses the labels each founder's areas should read as", () => {
    const business = { frontend: "product", backend: "the build", infra: "roles", data: "proof" };
    const report = compareFounders(
      {
        name: "Dana",
        payload: { ...samplePayload, signals: { ...samplePayload.signals, areas: { frontend: 0.7, infra: 0.3 } } },
        areaLabels: business,
      },
      {
        name: "Lee",
        payload: { ...samplePayload, signals: { ...samplePayload.signals, areas: { backend: 0.6, data: 0.4 } } },
      },
    );
    expect(report.complements[0]).toBe("Dana covers product and roles; Lee covers backend and data.");
  });

  it("never leaves the report sections empty", () => {
    const report = compareFounders({ name: "A", payload: samplePayload }, { name: "B", payload: samplePayload });
    expect(report.complements.length).toBeGreaterThan(0);
    expect(report.frictions.length).toBeGreaterThan(0);
  });
});

describe("mixed pairs", () => {
  it("describes each founder in their own terms", () => {
    const report = compareFounders(
      {
        name: "Dana",
        voice: "business",
        payload: { ...samplePayload, scores: { planning: 50, quality: 80, pace: 50, exploration: 50, steering: 50 } },
      },
      {
        name: "Lee",
        payload: { ...samplePayload, scores: { planning: 50, quality: 30, pace: 50, exploration: 50, steering: 50 } },
      },
    );
    expect(report.complements).toContain(
      "Dana brings what Lee is lighter on: someone who double-checks the facts and numbers.",
    );
  });
});
