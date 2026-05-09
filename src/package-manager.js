import { exec } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { success, warning } from "./logger.js";

const execAsync = promisify(exec);

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export const detectPackageManager = async (cwd = process.cwd()) => {
  const pnpmLock = path.join(cwd, "pnpm-lock.yaml");
  const yarnLock = path.join(cwd, "yarn.lock");
  const npmLock = path.join(cwd, "package-lock.json");

  if (await fileExists(pnpmLock)) return "pnpm";
  if (await fileExists(yarnLock)) return "yarn";
  if (await fileExists(npmLock)) return "npm";

  warning("Could not detect lockfile — defaulting to npm");
  return "npm";
};

export const getInstallCommand = ({
  packageManager,
  packages,
  dev = false,
}) => {
  const packageList = packages.join(" ");

  switch (packageManager) {
    case "pnpm":
      return `pnpm add ${dev ? "-D" : ""} ${packageList}`;
    case "yarn":
      return `yarn add ${dev ? "-D" : ""} ${packageList}`;
    case "npm":
    default:
      return `npm install ${dev ? "--save-dev" : ""} ${packageList}`;
  }
};

export const installDependencies = async (packages, options = {}) => {
  const { dev = false, cwd = process.cwd(), execCommand = execAsync } = options;
  const packageManager = await detectPackageManager(cwd);
  const installCommand = getInstallCommand({ packageManager, packages, dev });

  console.log(`📦 Installing dependencies with ${packageManager}...`);

  try {
    await execCommand(installCommand, { cwd });
  } catch (err) {
    if (packageManager !== "npm" || !err.stderr?.includes("ERESOLVE")) {
      throw err;
    }

    warning(
      "npm detected a peer dependency conflict. Retrying with --legacy-peer-deps...",
    );
    await execCommand(
      `npm install ${dev ? "--save-dev" : ""} --legacy-peer-deps ${packages.join(
        " ",
      )}`,
      { cwd },
    );
  }

  success(`Install of ${packages.join(", ")} complete`);
};
