import { version } from "../package.json";
import { analyze } from "./analyze";
import { USAGE, parseOptions } from "./args";
import { failure } from "./terminal";

async function main(): Promise<number> {
  const options = parseOptions(process.argv.slice(2));
  if (options.command === "help") {
    console.log(USAGE);
    return 0;
  }
  if (options.command === "version") {
    console.log(version);
    return 0;
  }
  return analyze(options, version);
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    failure(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
