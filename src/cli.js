import { readAppConfig } from "./config.js";
import { installResources } from "./installer.js";
import { fatal, showCopyright, showUsage } from "./logger.js";

export const runCli = async ({ args = process.argv.slice(2) } = {}) => {
  const appConfig = readAppConfig();

  if (args.length < 1) {
    showUsage(appConfig);
    process.exit(2);
  }

  try {
    await installResources({
      destination: args[0],
      cwd: process.cwd(),
    });
  } catch (err) {
    fatal(err.stderr || err.message);
    showCopyright(appConfig);
    process.exit(1);
  }

  showCopyright(appConfig);
};
