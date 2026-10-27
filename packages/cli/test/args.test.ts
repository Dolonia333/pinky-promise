import { describe, expect, it } from "vitest";
import { parseOptions } from "../src/args";

describe("parseOptions", () => {
  it("defaults to analyze", () => {
    expect(parseOptions([], {})).toMatchObject({
      command: "analyze",
      all: false,
      dryRun: false,
      json: false,
      apiUrl: null,
    });
  });

  it("reads every option", () => {
    const options = parseOptions(
      [
        "analyze",
        "--project",
        ".",
        "--all",
        "--dry-run",
        "--json",
        "--email",
        "a@x.io",
        "--email",
        "b@x.io",
        "--code",
        "PP-7F3K",
      ],
      {},
    );
    expect(options).toMatchObject({
      project: ".",
      all: true,
      dryRun: true,
      json: true,
      emails: ["a@x.io", "b@x.io"],
      code: "PP-7F3K",
    });
  });

  it("takes the API address from the environment", () => {
    expect(parseOptions([], { PINKY_PROMISE_API_URL: "https://api.example.com" }).apiUrl).toBe(
      "https://api.example.com",
    );
    expect(parseOptions(["--api", "http://localhost:8787"], { PINKY_PROMISE_API_URL: "x" }).apiUrl).toBe(
      "http://localhost:8787",
    );
  });

  it("handles help, version, and unknown commands", () => {
    expect(parseOptions(["--help"], {}).command).toBe("help");
    expect(parseOptions(["-v"], {}).command).toBe("version");
    expect(() => parseOptions(["deploy"], {})).toThrow(/Unknown command/);
  });
});
