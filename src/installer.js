import fs from "node:fs";
import path from "node:path";
import { resourcesTemplatePath } from "./config.js";
import { installDependencies } from "./package-manager.js";
import { addScriptsToPackageJson, resourceScripts } from "./package-json.js";
import { success } from "./logger.js";

export const installResources = async ({
  destination,
  cwd = process.cwd(),
  templatePath = resourcesTemplatePath,
} = {}) => {
  const currentDir = `./${destination.replace("./", "")}`;
  const destinationDir = path.resolve(cwd, currentDir);
  const resourcesDir = path.join(destinationDir, "resources");

  console.log(`\n🚀 Installing resources in ${currentDir}... ${cwd}`);

  fs.mkdirSync(destinationDir, { recursive: true });
  fs.cpSync(templatePath, resourcesDir, { force: true, recursive: true });

  success(`Resources (token, fonts, scss) installed in ${resourcesDir}`);

  await addScriptsToPackageJson(resourceScripts, cwd);

  await installDependencies(["json-to-scss", "sass", "prettier"], {
    dev: true,
    cwd,
  });
};
