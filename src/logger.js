import chalk from "chalk";

export const success = (msg) => console.log(chalk.greenBright(`🤙 ${msg}`));

export const warning = (msg) => console.warn(`⚠️ ${msg}`);

export const fatal = (msg) => console.log(chalk.red(`💀 ${msg}`));

export const showCopyright = ({ name, version, author }) => {
  console.log(`\n💥 ${name} v${version} © ${author}`);
};

export const showUsage = ({ name }) => {
  success(`USAGE: npx ${name} <destination dir>`);
};
