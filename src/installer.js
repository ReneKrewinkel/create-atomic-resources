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

export const installResources = async ({
  destination,
  cwd = process.cwd(),
  templatePath = resourcesTemplatePath,
} = {}) => {
  const currentDir = `./${destination.replace("./", "")}`;
  const destinationDir = path.resolve(cwd, currentDir);
  const resourcesDir = path.join(destinationDir, "resources");
  const nativeProject = isNativeProject(cwd);

  console.log(`\n🚀 Installing resources in ${currentDir}... ${cwd}`);

  fs.mkdirSync(destinationDir, { recursive: true });
  fs.cpSync(templatePath, resourcesDir, { force: true, recursive: true });

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
    nativeProject ? ["prettier"] : ["json-to-scss", "sass", "prettier"],
    {
      dev: true,
      cwd,
    },
  );
};
