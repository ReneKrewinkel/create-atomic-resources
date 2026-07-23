import fs from "node:fs";
import path from "node:path";
import { resourcesTemplatePath } from "./config.js";
import { installDependencies } from "./package-manager.js";
import {
  addScriptsToPackageJson,
  nativeResourceScripts,
  resourceScripts,
} from "./package-json.js";
import { success } from "./logger.js";
import { installNativeResources, isNativeProject } from "./native-resources.js";

const webResourceDependencies = ["json-to-scss", "sass@1.93.2", "prettier"];

export const installResources = async ({
  destination,
  cwd = process.cwd(),
  templatePath = resourcesTemplatePath,
  confirmOverwrite = async () => false,
} = {}) => {
  const currentDir = `./${destination.replace("./", "")}`;
  const destinationDir = path.resolve(cwd, currentDir);
  const resourcesDir = path.join(destinationDir, "resources");
  const tokenPath = path.join(resourcesDir, "design", "tokens.json");
  const nativeProject = isNativeProject(cwd);

  console.log(`\n🚀 Installing resources in ${currentDir}... ${cwd}`);

  const preserveToken =
    fs.existsSync(tokenPath) && !(await confirmOverwrite(tokenPath));

  fs.mkdirSync(destinationDir, { recursive: true });
  fs.cpSync(templatePath, resourcesDir, {
    filter: (_sourcePath, destinationPath) =>
      !preserveToken || path.resolve(destinationPath) !== tokenPath,
    force: true,
    recursive: true,
  });

  if (preserveToken) {
    success(`Kept existing token file at ${tokenPath}`);
  }

  if (nativeProject) {
    installNativeResources({ cwd, destinationDir, resourcesDir });
  }

  success(
    `Resources (token, fonts, ${nativeProject ? "native styles" : "scss"}) installed in ${resourcesDir}`,
  );

  await addScriptsToPackageJson(
    nativeProject ? nativeResourceScripts : resourceScripts,
    cwd,
  );

  await installDependencies(
    nativeProject ? ["prettier"] : webResourceDependencies,
    {
      dev: true,
      cwd,
    },
  );
};
