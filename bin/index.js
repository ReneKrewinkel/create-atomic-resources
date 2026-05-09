#! /usr/bin/env node

import chalk from "chalk";
import fs from "fs-extra";
import * as url from "url";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { access } from "fs/promises";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url)).slice(0, -1);

const appPackage = `${__dirname}/../package.json`;
const templatePath = `${__dirname}/src`.replace("/bin", "");

const convertToPascalCase = (s) => {
  const r = s.replace(
    /\w+/g,
    (word) => word[0].toUpperCase() + word.slice(1).toLowerCase(),
  );
  return r.split(" ").join("");
};

const readConfig = () => {
  const cfg = JSON.parse(fs.readFileSync(appPackage, "utf8"));
  return [
    cfg.name,
    convertToPascalCase(cfg.name.replace("-", " ")),
    cfg.version,
    cfg.author,
    cfg.files.src,
  ];
};

const [appName, appBanner, appVersion, appAuthor, templateRep] = readConfig();

const showCopyright = () => {
  console.log(`\n💥 ${appName} v${appVersion} © ${appAuthor}`);
};

const error = (msg) => {
  console.log(chalk.red(`💀 ${msg}`));
  process.exit(1);
};

const success = (msg) => console.log(chalk.greenBright(`🤙 ${msg}`));

const usage = () => {
  const msg = `USAGE: npx ${appName} <destination dir>`;
  console.log(chalk.greenBright(`🤙 ${msg}`));
  process.exit(2);
};

const addScriptsToPackageJson = async (scripts, cwd = process.cwd()) => {
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

  success(`package.json updated`);
};

const execAsync = promisify(exec);

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

const detectPackageManager = async (cwd = process.cwd()) => {
  const pnpmLock = path.join(cwd, "pnpm-lock.yaml");
  const yarnLock = path.join(cwd, "yarn.lock");
  const npmLock = path.join(cwd, "package-lock.json");
  if (await fileExists(pnpmLock)) return "pnpm";
  if (await fileExists(yarnLock)) return "yarn";
  if (await fileExists(npmLock)) return "npm";

  console.warn("⚠️ Could not detect lockfile — defaulting to npm");
  return "npm";
};

const installDependencies = async (packages, options = {}) => {
  const { dev = false, cwd = process.cwd() } = options;
  const packageManager = await detectPackageManager(cwd);
  const packageList = packages.join(" ");
  const npmDevFlag = dev ? "--save-dev" : "";

  let installCommand = "";

  switch (packageManager) {
    case "pnpm":
      installCommand = `pnpm add ${dev ? "-D" : ""} ${packageList}`;
      break;
    case "yarn":
      installCommand = `yarn add ${dev ? "-D" : ""} ${packageList}`;
      break;
    case "npm":
    default:
      installCommand = `npm install ${npmDevFlag} ${packageList}`;
      break;
  }

  console.log(`📦 Installing dependencies with ${packageManager}...`);

  try {
    await execAsync(installCommand, { cwd });
  } catch (err) {
    if (packageManager !== "npm" || !err.stderr?.includes("ERESOLVE")) {
      throw err;
    }

    console.warn(
      "⚠️ npm detected a peer dependency conflict. Retrying with --legacy-peer-deps...",
    );
    await execAsync(
      `npm install ${npmDevFlag} --legacy-peer-deps ${packageList}`,
      { cwd },
    );
  }

  success(`Install of ${packages.join(", ")} complete`);
};

const main = async () => {
  const args = process.argv.slice(2);
  if (args.length < 1) usage();

  const homeDir = process.cwd();
  const currentDir = `./${args[0].replace("./", "")}`;
  console.log(`\n🚀 Installing resources in ${currentDir}... ${homeDir}`);

  try {
    fs.ensureDirSync(currentDir);
    fs.copySync(templatePath, currentDir, { overwrite: true });

    await installDependencies(["json-to-scss", "sass", "prettier"], {
      dev: true,
      cwd: homeDir,
    });
    success(
      `Resources (token, fonts, scss) installed in ${currentDir}/resources`,
    );

    await addScriptsToPackageJson(
      {
        token:
          "json-to-scss ./src/resources/design/tokens.json ./src/resources/styles/tokens/_tokens.scss",
        scss: "sass --quiet ./src/resources/styles/main.scss ./src/resources/styles/main.css",
        nice: "prettier -w ./src/**",
      },
      homeDir,
    );
  } catch (err) {
    console.log(chalk.red(`💀 ${err.stderr || err.message}`));
    showCopyright();
    process.exit(1);
  }

  showCopyright();
};

main();
