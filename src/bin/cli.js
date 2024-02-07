#!/usr/bin/env node

import { generateHashesAndReplace } from "../index.js";
import process from "node:process";

const parseArguments = (args) => {
  let root = "";
  let cwds = null;

  for (const arg of args) {
    if (arg.startsWith("--root=")) {
      root = arg.split("=", 2)[1];
    } else if (arg.startsWith("--cwds=")) {
      cwds = arg.split("=", 2)[1].split(",");
    }
  }

  if (!root || !cwds) {
    console.error(
      'Usage: npx hasset --root="/path/to/scan/" --cwds="/location/to/do/the/replacement1/,/location/to/do/the/replacement2/"',
    );
    process.exit(1);
  }

  return { root, cwds };
};

const main = async () => {
  const { root, cwds } = parseArguments(process.argv.slice(2));

  try {
    console.log(`Generating hashes and updating file paths...`);
    console.log(`Scanning files in: ${root}`);
    console.log(`Updating files in: ${cwds}`);

    await generateHashesAndReplace({
      roots: root,
      cwds,
    });

    console.log("Hash generation and file updates completed successfully.");
  } catch (error) {
    console.error(`Error occurred: ${error.message}`);
    process.exit(1);
  }
};

main();
