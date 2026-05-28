#! /usr/bin/env node

import fs from "node:fs";
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

const realpath = (filePath) => fs.realpathSync.native(path.resolve(filePath));
const currentFile = realpath(fileURLToPath(import.meta.url));
const isDirectRun =
  process.argv[1] && realpath(process.argv[1]) === currentFile;

if (isDirectRun) {
  runCli();
}
