import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  clean: true,
  noExternal: ["@pinky-promise/shared"],
  banner: { js: "#!/usr/bin/env node" },
});
