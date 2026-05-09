import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { convertToPascalCase } from "../src/case.js";
import { addScriptsToPackageJson } from "../src/package-json.js";
import {
  detectPackageManager,
  getInstallCommand,
  installDependencies,
} from "../src/package-manager.js";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const cliPath = path.join(repoRoot, "bin/index.js");

const makeTempDir = () =>
  fs.mkdtempSync(path.join(os.tmpdir(), "create-atomic-resources-"));

const writePackageJson = (dir, packageJson = {}) => {
  fs.writeFileSync(
    path.join(dir, "package.json"),
    `${JSON.stringify(
      {
        name: "test-app",
        version: "1.0.0",
        ...packageJson,
      },
      null,
      2,
    )}\n`,
  );
};

const silenceConsole = async (fn) => {
  const originalLog = console.log;
  const originalWarn = console.warn;
  console.log = () => {};
  console.warn = () => {};

  try {
    return await fn();
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
  }
};

test("convertToPascalCase converts package names for the banner", () => {
  assert.equal(
    convertToPascalCase("create atomic resources"),
    "CreateAtomicResources",
  );
});

test("detectPackageManager prefers pnpm, then yarn, then npm", async () => {
  const dir = makeTempDir();

  fs.writeFileSync(path.join(dir, "package-lock.json"), "{}");
  assert.equal(await detectPackageManager(dir), "npm");

  fs.writeFileSync(path.join(dir, "yarn.lock"), "");
  assert.equal(await detectPackageManager(dir), "yarn");

  fs.writeFileSync(path.join(dir, "pnpm-lock.yaml"), "");
  assert.equal(await detectPackageManager(dir), "pnpm");
});

test("detectPackageManager defaults to npm when no lockfile exists", async () => {
  const dir = makeTempDir();

  assert.equal(await silenceConsole(() => detectPackageManager(dir)), "npm");
});

test("addScriptsToPackageJson adds resource scripts without removing existing scripts", async () => {
  const dir = makeTempDir();
  writePackageJson(dir, {
    scripts: {
      dev: "vite",
    },
  });

  await silenceConsole(() =>
    addScriptsToPackageJson(
      {
        token: "json-to-scss input output",
        scss: "sass input output",
      },
      dir,
    ),
  );

  const packageJson = JSON.parse(
    fs.readFileSync(path.join(dir, "package.json"), "utf8"),
  );

  assert.deepEqual(packageJson.scripts, {
    dev: "vite",
    token: "json-to-scss input output",
    scss: "sass input output",
  });
});

test("installDependencies uses the detected package manager commands", async () => {
  const cases = [
    {
      lockfile: "package-lock.json",
      command: "npm install --save-dev sass prettier",
    },
    {
      lockfile: "yarn.lock",
      command: "yarn add -D sass prettier",
    },
    {
      lockfile: "pnpm-lock.yaml",
      command: "pnpm add -D sass prettier",
    },
  ];

  for (const { lockfile, command } of cases) {
    const dir = makeTempDir();
    const commands = [];
    fs.writeFileSync(path.join(dir, lockfile), "");

    await silenceConsole(() =>
      installDependencies(["sass", "prettier"], {
        cwd: dir,
        dev: true,
        execCommand: async (cmd) => {
          commands.push(cmd);
        },
      }),
    );

    assert.deepEqual(commands, [command]);
  }
});

test("getInstallCommand builds install commands for supported package managers", () => {
  assert.equal(
    getInstallCommand({
      packageManager: "npm",
      packages: ["sass", "prettier"],
      dev: true,
    }),
    "npm install --save-dev sass prettier",
  );
  assert.equal(
    getInstallCommand({
      packageManager: "pnpm",
      packages: ["sass", "prettier"],
      dev: true,
    }),
    "pnpm add -D sass prettier",
  );
  assert.equal(
    getInstallCommand({
      packageManager: "yarn",
      packages: ["sass", "prettier"],
      dev: true,
    }),
    "yarn add -D sass prettier",
  );
});

test("installDependencies retries npm peer conflicts with legacy peer deps", async () => {
  const dir = makeTempDir();
  const commands = [];
  fs.writeFileSync(path.join(dir, "package-lock.json"), "{}");

  await silenceConsole(() =>
    installDependencies(["json-to-scss", "sass", "prettier"], {
      cwd: dir,
      dev: true,
      execCommand: async (cmd) => {
        commands.push(cmd);

        if (commands.length === 1) {
          const err = new Error("install failed");
          err.stderr = "npm error ERESOLVE unable to resolve dependency tree";
          throw err;
        }
      },
    }),
  );

  assert.deepEqual(commands, [
    "npm install --save-dev json-to-scss sass prettier",
    "npm install --save-dev --legacy-peer-deps json-to-scss sass prettier",
  ]);
});

test("cli copies resources, installs dependencies, and adds package scripts", () => {
  const dir = makeTempDir();
  const binDir = path.join(dir, "bin");
  const npmLogPath = path.join(dir, "npm-args.txt");

  writePackageJson(dir);
  fs.mkdirSync(binDir);
  fs.writeFileSync(
    path.join(binDir, "npm"),
    `#!/usr/bin/env node
const fs = require("node:fs");
fs.appendFileSync(${JSON.stringify(npmLogPath)}, process.argv.slice(2).join(" ") + "\\n");
`,
    { mode: 0o755 },
  );

  const result = spawnSync(process.execPath, [cliPath, "./src"], {
    cwd: dir,
    env: {
      ...process.env,
      PATH: `${binDir}${path.delimiter}${process.env.PATH}`,
    },
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(
    fs.existsSync(path.join(dir, "src/resources/styles/main.scss")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(dir, "src/resources/design/tokens.json")),
    true,
  );
  assert.equal(
    fs.readFileSync(npmLogPath, "utf8"),
    "install --save-dev json-to-scss sass prettier\n",
  );

  const packageJson = JSON.parse(
    fs.readFileSync(path.join(dir, "package.json"), "utf8"),
  );

  assert.equal(
    packageJson.scripts.token,
    "json-to-scss ./src/resources/design/tokens.json ./src/resources/styles/tokens/_tokens.scss",
  );
  assert.equal(
    packageJson.scripts.scss,
    "sass --quiet ./src/resources/styles/main.scss ./src/resources/styles/main.css",
  );
  assert.equal(packageJson.scripts.nice, "prettier -w ./src/**");
});
