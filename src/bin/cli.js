#!/usr/bin/env node

import { generateHashesAndReplace } from "../index.js";
import process from "node:process";

const parseArguments = (args) => {
  let rootPath = "";
  let cwd = "";

  for (const arg of args) {
    if (arg.startsWith("--rootPath=")) {
      rootPath = arg.split("=", 2)[1];
    } else if (arg.startsWith("--cwd=")) {
      cwd = arg.split("=", 2)[1];
    }
  }

  if (!rootPath || !cwd) {
    console.error(
      'Usage: npx hasset --rootPath="/path/to/scan" --cwd="/location/to/do/the/replacement"',
    );
    process.exit(1);
  }

  return { rootPath, cwd };
};

const main = async () => {
  const { rootPath, cwd } = parseArguments(process.argv.slice(2));

  try {
    console.log(`Generating hashes and updating file paths...`);
    console.log(`Scanning files in: ${rootPath}`);
    console.log(`Updating files in: ${cwd}`);

    await generateHashesAndReplace({
      rootPaths: rootPath,
      updateCwd: cwd,
    });

    console.log("Hash generation and file updates completed successfully.");
  } catch (error) {
    console.error(`Error occurred: ${error.message}`);
    process.exit(1);
  }
};

main();
