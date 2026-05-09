import fs from "fs-extra";
import path from "node:path";
import { success } from "./logger.js";

export const resourceScripts = {
  token:
    "json-to-scss ./src/resources/design/tokens.json ./src/resources/styles/tokens/_tokens.scss",
  scss: "sass --quiet ./src/resources/styles/main.scss ./src/resources/styles/main.css",
  nice: "prettier -w ./src/**",
};

export const addScriptsToPackageJson = async (scripts, cwd = process.cwd()) => {
  const packageJsonPath = path.join(cwd, "package.json");

  const packageJsonRaw = await fs.readFile(packageJsonPath, "utf-8");
  const packageJson = JSON.parse(packageJsonRaw);

  packageJson.scripts = packageJson.scripts || {};

  for (const [scriptName, scriptCommand] of Object.entries(scripts)) {
    packageJson.scripts[scriptName] = scriptCommand;
    success(`Added script "${scriptName}": "${scriptCommand}"`);
  }

  await fs.writeFile(
    packageJsonPath,
    `${JSON.stringify(packageJson, null, 2)}\n`,
    "utf-8",
  );

  success("package.json updated");
};
