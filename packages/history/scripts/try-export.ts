import { readFileSync } from "node:fs";
import { ExportError, analyzeExport } from "../src";
import { profileReport } from "../src/report";

const path = process.argv[2];
if (!path) {
  console.error("Usage: npm run history -- path/to/export.zip");
  process.exit(1);
}

try {
  const payload = analyzeExport(new Uint8Array(readFileSync(path)));
  console.log(profileReport(payload).join("\n"));
  console.log("\nExactly what the website would receive:");
  console.log(JSON.stringify(payload, null, 2));
  console.log("\nNothing was uploaded. This runs only on this machine.");
} catch (error) {
  console.error(error instanceof ExportError ? error.message : String(error));
  process.exit(1);
}
