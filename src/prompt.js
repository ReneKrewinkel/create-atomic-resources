import readline from "node:readline";

export const confirmTokenOverwrite = (
  tokenPath,
  { input = process.stdin, output = process.stdout } = {},
) =>
  new Promise((resolve) => {
    const prompt = readline.createInterface({ input, output });
    let settled = false;

    const finish = (overwrite) => {
      if (settled) return;
      settled = true;
      prompt.close();
      resolve(overwrite);
    };

    prompt.on("close", () => finish(false));
    prompt.question(
      `${tokenPath} already exists. Overwrite tokens.json? [y/N] `,
      (answer) => finish(/^(y|yes)$/iu.test(answer.trim())),
    );
  });
