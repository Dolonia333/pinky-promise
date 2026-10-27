import { describe, expect, it } from "vitest";
import { classifyCommand, classifyFile, renamedPath } from "../src/classify";

describe("classifyCommand", () => {
  it.each([
    ["npm test", "test"],
    ["npx vitest run src/a.test.ts", "test"],
    ["cd api && go test ./...", "test"],
    ["python -m pytest -q", "test"],
    ["npm run build", "build"],
    ["npx tsc --noEmit", "build"],
    ["npx eslint .", "lint"],
    ["pnpm add zod", "install"],
    ["git status", "explore"],
    ["rg signIn src", "explore"],
    ["git commit -m 'wip'", "git"],
    ["node scripts/seed.js", "other"],
  ])("%s is %s", (command, category) => {
    expect(classifyCommand(command)).toBe(category);
  });
});

describe("classifyFile", () => {
  it.each([
    ["src/components/Login.tsx", "frontend", false],
    ["web/src/api.ts", "frontend", false],
    ["server/routes/users.ts", "backend", false],
    ["internal/authz/check_test.go", "backend", true],
    ["tests/test_model.py", "backend", true],
    ["ml/train.py", "data", false],
    ["db/migrations/001_init.sql", "data", false],
    [".github/workflows/ci.yml", "infra", false],
    ["Dockerfile", "infra", false],
    ["deploy/main.tf", "infra", false],
    ["src/app.spec.ts", "backend", true],
    ["README.md", null, false],
  ])("%s is %s", (path, area, isTest) => {
    expect(classifyFile(path)).toEqual({ area, isTest });
  });
});

describe("renamedPath", () => {
  it("keeps the new name of renamed files", () => {
    expect(renamedPath("src/{old => new}/a.ts")).toBe("src/new/a.ts");
    expect(renamedPath("a.ts => b.ts")).toBe("b.ts");
    expect(renamedPath("src/{ => lib}/a.ts")).toBe("src/lib/a.ts");
    expect(renamedPath("src/a.ts")).toBe("src/a.ts");
  });
});
