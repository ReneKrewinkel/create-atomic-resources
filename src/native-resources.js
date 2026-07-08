import fs from "node:fs";
import path from "node:path";

const dependencyGroups = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

const nativePackages = new Set(["expo", "react-native"]);

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const writeFile = (filePath, content) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

const cleanTokenUri = (value) =>
  String(value || "")
    .trim()
    .replace(/^['"]|['"]$/gu, "");

const toFontAssetPath = (value) => {
  const clean = cleanTokenUri(value);
  return /\.[a-z0-9]+$/iu.test(clean) ? clean : `${clean}.ttf`;
};

const validIdentifierPattern = /^[A-Za-z_$][\w$]*$/u;

const stringifyNativeValue = (value, indent = 0) => {
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";

    const itemIndent = " ".repeat(indent + 2);
    const closingIndent = " ".repeat(indent);
    return [
      "[",
      ...value.map(
        (item) => `${itemIndent}${stringifyNativeValue(item, indent + 2)},`,
      ),
      `${closingIndent}]`,
    ].join("\n");
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return "{}";

    const itemIndent = " ".repeat(indent + 2);
    const closingIndent = " ".repeat(indent);
    return [
      "{",
      ...entries.map(([key, item]) => {
        const property = validIdentifierPattern.test(key)
          ? key
          : JSON.stringify(key);
        return `${itemIndent}${property}: ${stringifyNativeValue(item, indent + 2)},`;
      }),
      `${closingIndent}}`,
    ].join("\n");
  }

  return JSON.stringify(value);
};

const toStyleFile = ({ exports, imports = "", ts }) =>
  [
    imports.trim(),
    ...Object.entries(exports).map(
      ([name, value]) =>
        `export const ${name} = ${stringifyNativeValue(value)}${ts ? " as const" : ""}`,
    ),
    "",
  ]
    .filter(Boolean)
    .join("\n\n");

const toFontsFile = ({ fonts, ts }) => {
  const fontAssets = [
    "export const fontAssets = {",
    ...Object.entries(fonts).map(
      ([name, config]) =>
        `  ${validIdentifierPattern.test(name) ? name : JSON.stringify(name)}: require(${JSON.stringify(toFontAssetPath(config.uri))}),`,
    ),
    `}${ts ? " as const" : ""}`,
  ].join("\n");

  return [toStyleFile({ exports: { fonts }, ts }), fontAssets, ""].join("\n");
};

const toMainFile = ({ rest, ts }) =>
  [
    "import { colors } from './colors'",
    "import { fontAssets, fonts } from './fonts'",
    "",
    `export const tokens = ${stringifyNativeValue(rest)}${ts ? " as const" : ""}`,
    "",
    "export const resources = {",
    "  colors,",
    "  fontAssets,",
    "  fonts,",
    "  ...tokens,",
    `}${ts ? " as const" : ""}`,
    "",
  ].join("\n");

export const isNativeProject = (cwd = process.cwd()) => {
  const packageJsonPath = path.join(cwd, "package.json");
  if (!fs.existsSync(packageJsonPath)) return false;

  const packageJson = readJson(packageJsonPath);
  return dependencyGroups
    .map((group) => packageJson[group])
    .filter(Boolean)
    .some((dependencies) =>
      Object.keys(dependencies).some((name) => nativePackages.has(name)),
    );
};

export const usesTypeScript = (cwd = process.cwd()) => {
  const packageJsonPath = path.join(cwd, "package.json");
  if (fs.existsSync(path.join(cwd, "tsconfig.json"))) return true;
  if (!fs.existsSync(packageJsonPath)) return false;

  const packageJson = readJson(packageJsonPath);
  return dependencyGroups
    .map((group) => packageJson[group])
    .filter(Boolean)
    .some((dependencies) => Boolean(dependencies.typescript));
};

export const createNativeStyleFiles = ({
  extension,
  resourcesDir,
  tokenPath = path.join(resourcesDir, "design", "tokens.json"),
} = {}) => {
  const ts = extension === "ts";
  const tokens = readJson(tokenPath);
  const colors = Object.fromEntries(
    (tokens.colors || []).map((item) => [item.type, item.color]),
  );
  const fonts = Object.fromEntries(
    (tokens.fonts || []).map((item) => [
      item.type,
      {
        uri: cleanTokenUri(item.uri),
        sizes: item.sizes || [],
      },
    ]),
  );
  const rest = Object.fromEntries(
    Object.entries(tokens).filter(
      ([key]) => !["colors", "fonts"].includes(key),
    ),
  );
  const stylesDir = path.join(resourcesDir, "styles");

  writeFile(
    path.join(stylesDir, `colors.${extension}`),
    toStyleFile({ exports: { colors }, ts }),
  );
  writeFile(
    path.join(stylesDir, `fonts.${extension}`),
    toFontsFile({ fonts, ts }),
  );
  writeFile(
    path.join(stylesDir, `main.${extension}`),
    toMainFile({ rest, ts }),
  );
  writeFile(
    path.join(stylesDir, `index.${extension}`),
    [
      "export * from './colors'",
      "export * from './fonts'",
      "export * from './main'",
      "",
    ].join("\n"),
  );
};

export const createNativeTokenScript = ({ extension, resourcesDir }) => {
  const scriptPath = path.join(resourcesDir, "scripts", "tokens-to-native.mjs");
  writeFile(
    scriptPath,
    `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const resourcesDir = path.resolve(new URL("..", import.meta.url).pathname);
const extension = process.argv.includes("--js") ? "js" : ${JSON.stringify(extension)};
const ts = extension === "ts";
const tokenPath = path.join(resourcesDir, "design", "tokens.json");
const stylesDir = path.join(resourcesDir, "styles");
const tokens = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
const cleanTokenUri = (value) => String(value || "").trim().replace(/^['"]|['"]$/gu, "");
const toFontAssetPath = (value) => {
  const clean = cleanTokenUri(value);
  return /\\.[a-z0-9]+$/iu.test(clean) ? clean : \`\${clean}.ttf\`;
};
const validIdentifierPattern = /^[A-Za-z_$][\\w$]*$/u;
const stringifyNativeValue = (value, indent = 0) => {
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";

    const itemIndent = " ".repeat(indent + 2);
    const closingIndent = " ".repeat(indent);
    return [
      "[",
      ...value.map((item) => \`\${itemIndent}\${stringifyNativeValue(item, indent + 2)},\`),
      \`\${closingIndent}]\`,
    ].join("\\n");
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return "{}";

    const itemIndent = " ".repeat(indent + 2);
    const closingIndent = " ".repeat(indent);
    return [
      "{",
      ...entries.map(([key, item]) => {
        const property = validIdentifierPattern.test(key) ? key : JSON.stringify(key);
        return \`\${itemIndent}\${property}: \${stringifyNativeValue(item, indent + 2)},\`;
      }),
      \`\${closingIndent}}\`,
    ].join("\\n");
  }

  return JSON.stringify(value);
};
const toStyleFile = ({ exports, imports = "" }) =>
  [imports.trim(), ...Object.entries(exports).map(([name, value]) =>
    \`export const \${name} = \${stringifyNativeValue(value)}\${ts ? " as const" : ""}\`
  ), ""].filter(Boolean).join("\\n\\n");
const toFontsFile = ({ fonts }) => {
  const fontAssets = [
    "export const fontAssets = {",
    ...Object.entries(fonts).map(([name, config]) =>
      \`  \${validIdentifierPattern.test(name) ? name : JSON.stringify(name)}: require(\${JSON.stringify(toFontAssetPath(config.uri))}),\`
    ),
    \`}\${ts ? " as const" : ""}\`,
  ].join("\\n");

  return [toStyleFile({ exports: { fonts } }), fontAssets, ""].join("\\n");
};
const toMainFile = ({ rest }) => [
  "import { colors } from './colors'",
  "import { fontAssets, fonts } from './fonts'",
  "",
  \`export const tokens = \${stringifyNativeValue(rest)}\${ts ? " as const" : ""}\`,
  "",
  "export const resources = {",
  "  colors,",
  "  fontAssets,",
  "  fonts,",
  "  ...tokens,",
  \`}\${ts ? " as const" : ""}\`,
  "",
].join("\\n");
const colors = Object.fromEntries((tokens.colors || []).map((item) => [item.type, item.color]));
const fonts = Object.fromEntries((tokens.fonts || []).map((item) => [
  item.type,
  { uri: cleanTokenUri(item.uri), sizes: item.sizes || [] },
]));
const rest = Object.fromEntries(Object.entries(tokens).filter(([key]) => !["colors", "fonts"].includes(key)));

fs.mkdirSync(stylesDir, { recursive: true });
fs.writeFileSync(path.join(stylesDir, \`colors.\${extension}\`), toStyleFile({ exports: { colors } }));
fs.writeFileSync(path.join(stylesDir, \`fonts.\${extension}\`), toFontsFile({ fonts }));
fs.writeFileSync(path.join(stylesDir, \`main.\${extension}\`), toMainFile({ rest }));
fs.writeFileSync(path.join(stylesDir, \`index.\${extension}\`), "export * from './colors'\\nexport * from './fonts'\\nexport * from './main'\\n");
`,
  );
};

export const createUseFontHook = ({ destinationDir, extension }) => {
  const hooksDir = path.join(destinationDir, "hooks");
  const hookDir = path.join(hooksDir, "useFont");
  const ts = extension === "ts";
  const typeSuffix = ts ? ": boolean" : "";

  writeFile(
    path.join(hooksDir, `index.${extension}`),
    "export * from './useFont'\n",
  );
  writeFile(
    path.join(hookDir, `index.${extension}`),
    "export * from './useFont'\n",
  );
  writeFile(
    path.join(hookDir, `useFont.${extension}`),
    `import { useEffect, useState } from 'react'

import { fontAssets } from '../../resources/styles'

export const useFont = ()${ts ? ": boolean" : ""} => {
  const [loaded, setLoaded] = useState${ts ? "<boolean>" : ""}(false)

  useEffect(() => {
    let active${typeSuffix} = true

    import('expo-font')
      .then(({ loadAsync }) => loadAsync(fontAssets))
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoaded(true)
      })

    return () => {
      active = false
    }
  }, [])

  return loaded
}
`,
  );
  writeFile(
    path.join(hookDir, "useFont.mdx"),
    [
      "# useFont",
      "",
      "Loads configured native fonts at runtime when `expo-font` is available.",
      "",
    ].join("\n"),
  );
};

export const prepareNativeResourceTree = ({ resourcesDir }) => {
  fs.rmSync(path.join(resourcesDir, "styles"), {
    force: true,
    recursive: true,
  });
  fs.rmSync(path.join(resourcesDir, "design", "tokens.example.json"), {
    force: true,
  });
};

export const copyNativeFontFallback = ({ resourcesDir }) => {
  const fontsDir = path.join(resourcesDir, "fonts");
  const fallbackPath = path.join(fontsDir, "arial.ttf");
  if (fs.existsSync(fallbackPath)) return;

  const sourcePath = path.join(fontsDir, "freesans.ttf");
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, fallbackPath);
  }
};

export const pruneNativeFonts = ({ resourcesDir }) => {
  const fontsDir = path.join(resourcesDir, "fonts");
  if (!fs.existsSync(fontsDir)) return;

  fs.readdirSync(fontsDir).forEach((fileName) => {
    if (fileName !== "arial.ttf") {
      fs.rmSync(path.join(fontsDir, fileName), { force: true });
    }
  });
};

export const installNativeResources = ({
  cwd = process.cwd(),
  destinationDir,
  resourcesDir,
} = {}) => {
  const extension = usesTypeScript(cwd) ? "ts" : "js";
  prepareNativeResourceTree({ resourcesDir });
  copyNativeFontFallback({ resourcesDir });
  pruneNativeFonts({ resourcesDir });
  createNativeStyleFiles({ extension, resourcesDir });
  createNativeTokenScript({ extension, resourcesDir });
  createUseFontHook({ destinationDir, extension });

  return { extension };
};
