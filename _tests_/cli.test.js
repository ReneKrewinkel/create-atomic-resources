import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { convertToPascalCase } from "../src/case.js";
import { addScriptsToPackageJson } from "../src/package-json.js";
import {
  createNativeStyleFiles,
  isNativeProject,
} from "../src/native-resources.js";
import {
  detectPackageManager,
  getInstallCommand,
  installDependencies,
} from "../src/package-manager.js";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const cliPath = path.join(repoRoot, "bin/index.js");
const packageEntryPath = path.join(repoRoot, "src/index.js");

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

const writeFakeNpm = (binDir, npmLogPath) => {
  fs.writeFileSync(
    path.join(binDir, "npm"),
    `#!/usr/bin/env node
const fs = require("node:fs");
fs.appendFileSync(${JSON.stringify(npmLogPath)}, process.argv.slice(2).join(" ") + "\\n");
`,
    { mode: 0o755 },
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

test("native detection checks expo and react-native dependencies", () => {
  const dir = makeTempDir();
  writePackageJson(dir, {
    dependencies: {
      expo: "^53.0.0",
    },
  });

  try {
    assert.equal(isNativeProject(dir), true);
  } finally {
    fs.rmSync(dir, { force: true, recursive: true });
  }
});

test("native style files are generated from design tokens", () => {
  const dir = makeTempDir();
  const resourcesDir = path.join(dir, "resources");
  fs.mkdirSync(path.join(resourcesDir, "design"), { recursive: true });
  fs.writeFileSync(
    path.join(resourcesDir, "design", "tokens.json"),
    JSON.stringify(
      {
        unit: "rem",
        colors: [{ type: "brand-primary", color: "#00f" }],
        fonts: [{ type: "body", uri: "'../fonts/body'", sizes: ["1rem"] }],
        page: { backgroundColor: "white" },
        spacing: { small: 1 },
      },
      null,
      2,
    ),
  );

  try {
    createNativeStyleFiles({ extension: "ts", resourcesDir });

    assert.match(
      fs.readFileSync(path.join(resourcesDir, "styles", "colors.ts"), "utf8"),
      /"brand-primary": "#00f"/u,
    );
    assert.match(
      fs.readFileSync(path.join(resourcesDir, "styles", "fonts.ts"), "utf8"),
      /uri: "\.\.\/fonts\/body"/u,
    );
    assert.match(
      fs.readFileSync(path.join(resourcesDir, "styles", "fonts.ts"), "utf8"),
      /body: require\("\.\.\/fonts\/body\.ttf"\)/u,
    );
    assert.match(
      fs.readFileSync(path.join(resourcesDir, "styles", "main.ts"), "utf8"),
      /page: \{\n    backgroundColor: "white"/u,
    );
    assert.match(
      fs.readFileSync(path.join(resourcesDir, "styles", "main.ts"), "utf8"),
      /spacing: \{\n    small: 1/u,
    );
    assert.match(
      fs.readFileSync(path.join(resourcesDir, "styles", "main.ts"), "utf8"),
      /export const resources/u,
    );
  } finally {
    fs.rmSync(dir, { force: true, recursive: true });
  }
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
  writeFakeNpm(binDir, npmLogPath);

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

test("cli installs native resources without scss files or sass tooling", () => {
  const dir = makeTempDir();
  const binDir = path.join(dir, "bin");
  const npmLogPath = path.join(dir, "npm-args.txt");

  writePackageJson(dir, {
    dependencies: {
      expo: "^53.0.0",
    },
    devDependencies: {
      typescript: "^5.0.0",
    },
  });
  fs.writeFileSync(path.join(dir, "tsconfig.json"), "{}");
  fs.mkdirSync(binDir);
  writeFakeNpm(binDir, npmLogPath);

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
    false,
  );
  assert.equal(
    fs.existsSync(path.join(dir, "src/resources/styles/tokens")),
    false,
  );
  assert.equal(
    fs.existsSync(path.join(dir, "src/resources/styles/colors.ts")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(dir, "src/resources/styles/fonts.ts")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(dir, "src/resources/fonts/arial.ttf")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(dir, "src/resources/fonts/freesans.ttf")),
    false,
  );
  assert.equal(
    fs.existsSync(path.join(dir, "src/resources/design/tokens.example.json")),
    false,
  );
  assert.equal(
    fs.existsSync(path.join(dir, "src/hooks/useFont/useFont.ts")),
    true,
  );
  assert.equal(
    fs.readFileSync(npmLogPath, "utf8"),
    "install --save-dev prettier\n",
  );

  const packageJson = JSON.parse(
    fs.readFileSync(path.join(dir, "package.json"), "utf8"),
  );

  assert.equal(packageJson.scripts.token, undefined);
  assert.equal(packageJson.scripts.scss, undefined);
  assert.equal(
    packageJson.scripts["token:native"],
    "node ./src/resources/scripts/tokens-to-native.mjs",
  );
  assert.equal(
    packageJson.scripts["token-to-native"],
    "node ./src/resources/scripts/tokens-to-native.mjs",
  );
  assert.equal(packageJson.scripts.nice, "prettier -w ./src/**");
});

test("cli runs when invoked through an npm bin symlink", () => {
  const dir = makeTempDir();
  const binDir = path.join(dir, "bin");
  const npmLogPath = path.join(dir, "npm-args.txt");
  const symlinkPath = path.join(binDir, "create-atomic-resources");

  writePackageJson(dir);
  fs.mkdirSync(binDir);
  writeFakeNpm(binDir, npmLogPath);
  fs.symlinkSync(cliPath, symlinkPath);

  const result = spawnSync(process.execPath, [symlinkPath, "./src"], {
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
    fs.readFileSync(npmLogPath, "utf8"),
    "install --save-dev json-to-scss sass prettier\n",
  );
});

test("bundled resources expose layout tokens as root custom properties", () => {
  const rootScss = fs.readFileSync(
    path.join(repoRoot, "src/resources/styles/root/_root.scss"),
    "utf8",
  );
  const mainCss = fs.readFileSync(
    path.join(repoRoot, "src/resources/styles/main.css"),
    "utf8",
  );

  assert.match(rootScss, /--spacing-#\{\$type\}/);
  assert.match(rootScss, /--border-radius-#\{\$type\}/);
  assert.match(rootScss, /--box-shadow-#\{\$type\}/);
  assert.match(mainCss, /--spacing-small: 1rem;/);
  assert.match(mainCss, /--border-radius-medium: 0\.5rem;/);
  assert.match(mainCss, /--semantic-color-danger: #d32f2f;/);
  assert.match(mainCss, /--z-index-modal: 1000;/);
  assert.match(mainCss, /--opacity-disabled: 0\.4;/);
  assert.match(mainCss, /--form-input-border: 1px solid #d0d0d0;/);
  assert.match(mainCss, /--form-input-border-bottom: 1px solid #d0d0d0;/);
  assert.match(
    mainCss,
    /--box-shadow-heavy: 0px 10px 20px rgba\(0, 0, 0, 0\.4\);/,
  );
});

test("font size tokens are stored as rem values", () => {
  const tokens = JSON.parse(
    fs.readFileSync(
      path.join(repoRoot, "src/resources/design/tokens.json"),
      "utf8",
    ),
  );

  const fontSizes = tokens.fonts.flatMap((font) => font.sizes);
  const headingSizes = tokens.headings.variant.flatMap((heading) =>
    Object.values(heading),
  );
  const mainCss = fs.readFileSync(
    path.join(repoRoot, "src/resources/styles/main.css"),
    "utf8",
  );

  [...fontSizes, ...headingSizes].forEach((size) => {
    assert.equal(typeof size, "string");
    assert.match(size, /^\d+(\.\d+)?rem$/);
  });
  assert.match(mainCss, /\.main-text-regular-12/);
  assert.match(mainCss, /font-size: 0\.75rem;/);
  assert.match(mainCss, /h1 \{\n  font-family: "heading";\n  font-size: 2rem;/);
});

test("utility module exposes flex position mixins", () => {
  const dir = makeTempDir();
  const inputPath = path.join(dir, "mixins.scss");
  const outputPath = path.join(dir, "mixins.css");

  fs.writeFileSync(
    inputPath,
    [
      `@use "${path.join(repoRoot, "src/resources/styles/utility")}" as utility;`,
      ".center { @include utility.flex-center-center; }",
      ".top-right { @include utility.flex-top-right; }",
      "",
    ].join("\n"),
  );

  const result = spawnSync(
    "npx",
    ["sass", "--quiet", "--no-source-map", inputPath, outputPath],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);

  const css = fs.readFileSync(outputPath, "utf8");

  assert.match(css, /\.center/);
  assert.match(css, /align-items: center;/);
  assert.match(css, /justify-content: center;/);
  assert.match(css, /\.top-right/);
  assert.match(css, /align-items: flex-start;/);
  assert.match(css, /justify-content: flex-end;/);
});

test("package entrypoint can be imported without running the cli", async () => {
  const dir = makeTempDir();
  writePackageJson(dir);

  const imported = await import(
    `${packageEntryPath}?cacheBust=${Date.now()}-${Math.random()}`
  );

  assert.equal(typeof imported.runCli, "function");
  assert.equal(fs.existsSync(path.join(dir, "src/resources")), false);
});
