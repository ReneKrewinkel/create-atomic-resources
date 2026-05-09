#! /usr/bin/env node

import { fileURLToPath } from "node:url";
import path from "node:path";
import { runCli } from "../src/cli.js";

export { convertToPascalCase } from "../src/case.js";
export { readAppConfig } from "../src/config.js";
export { addScriptsToPackageJson } from "../src/package-json.js";
export {
  detectPackageManager,
  installDependencies,
} from "../src/package-manager.js";
export { installResources } from "../src/installer.js";
export { runCli };

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  runCli();
}
