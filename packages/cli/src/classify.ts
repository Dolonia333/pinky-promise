import type { Area } from "@pinky-promise/shared";

export type CommandCategory = "test" | "build" | "lint" | "install" | "explore" | "git" | "other";

export interface FileKind {
  area: Area | null;
  isTest: boolean;
}

const COMMAND_PATTERNS: Array<[CommandCategory, RegExp]> = [
  [
    "test",
    /\b(vitest|jest|mocha|pytest|rspec|phpunit|go test|cargo test|dotnet test|bun test|deno test|robot|playwright test|(npm|pnpm|yarn)( run)? test|mvn( \S+)* test|gradlew?( \S+)* test)\b/,
  ],
  ["lint", /\b(eslint|prettier|biome|ruff|flake8|black|golangci-lint|gofmt|(npm|pnpm|yarn)( run)? lint)\b/],
  [
    "build",
    /\b(tsc|make|go build|cargo build|vite build|next build|docker build|mvn( \S+)* (package|compile|install)|gradlew?( \S+)* build|(npm|pnpm|yarn)( run)? build)\b/,
  ],
  [
    "install",
    /\b((npm|pnpm) (i|install|ci|add)|yarn add|pip3? install|uv (add|pip)|go (get|mod tidy)|cargo add|brew install|bundle install)\b/,
  ],
  [
    "explore",
    /^\s*(ls|cat|head|tail|less|tree|pwd|find|grep|rg|ag|wc|nl|sed -n|git (log|show|diff|status|blame|branch))\b/,
  ],
  ["git", /^\s*git\b/],
];

export function classifyCommand(command: string): CommandCategory {
  const match = COMMAND_PATTERNS.find(([, pattern]) => pattern.test(command));
  return match ? match[0] : "other";
}

const TEST_FILE =
  /(^|\/)(tests?|__tests__|specs?|e2e)\/|[._-](test|spec)\.[a-z0-9]+$|_test\.go$|(^|\/)test_[^/]+\.py$|\.robot$/i;

const INFRA_FILE =
  /(^|\/)(dockerfile|docker-compose[^/]*|makefile|procfile|\.github\/|k8s\/|helm\/|charts\/|terraform\/|infra\/|deploy\/|\.circleci\/)|\.(tf|tfvars|sh|bash|nix)$/i;
const DATA_FILE =
  /\.(sql|ipynb|csv|parquet|r|rmd)$|(^|\/)(notebooks?|ml|models?|etl|pipelines?|analysis|datasets?|migrations)\//i;
const FRONTEND_FILE = /\.(tsx|jsx|vue|svelte|astro|css|scss|sass|less|html)$/i;
const FRONTEND_DIR = /(^|\/)(frontend|client|web|ui|components|pages|views|public|styles)\//i;
const BACKEND_FILE = /\.(go|java|kt|rb|php|cs|rs|py|ts|js|mjs|cjs|ex|exs|scala|swift|c|cc|cpp|h|hpp)$/i;
const JS_FILE = /\.(ts|js|mjs|cjs)$/i;

export function classifyFile(path: string): FileKind {
  const normalized = path.replace(/\\/g, "/");
  return { area: areaOf(normalized), isTest: TEST_FILE.test(normalized) };
}

function areaOf(path: string): Area | null {
  if (INFRA_FILE.test(path)) return "infra";
  if (DATA_FILE.test(path)) return "data";
  if (FRONTEND_FILE.test(path)) return "frontend";
  if (JS_FILE.test(path) && FRONTEND_DIR.test(path)) return "frontend";
  if (BACKEND_FILE.test(path)) return "backend";
  return null;
}

export function renamedPath(path: string): string {
  const braced = path.match(/^(.*)\{(.*) => (.*)\}(.*)$/);
  if (braced) return `${braced[1]}${braced[3]}${braced[4]}`.replace(/\/\//g, "/");
  const arrow = path.indexOf(" => ");
  return arrow === -1 ? path : path.slice(arrow + 4);
}
