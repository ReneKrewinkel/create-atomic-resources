import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { convertToPascalCase } from "./case.js";

export const projectRoot = path.resolve(
  fileURLToPath(new URL("..", import.meta.url)),
);

export const appPackagePath = path.join(projectRoot, "package.json");
export const resourcesTemplatePath = path.join(projectRoot, "src/resources");

export const readAppConfig = (packagePath = appPackagePath) => {
  const cfg = JSON.parse(fs.readFileSync(packagePath, "utf8"));

  return {
    name: cfg.name,
    banner: convertToPascalCase(cfg.name.replace("-", " ")),
    version: cfg.version,
    author: cfg.author,
  };
};
