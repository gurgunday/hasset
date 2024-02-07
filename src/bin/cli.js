#!/usr/bin/env node

import { generateHashesAndReplace } from "../index.js";
import process from "node:process";

const parseArguments = (args) => {
  let roots = null;
  let cwds = null;

  for (const arg of args) {
    if (arg.startsWith("--roots=")) {
      roots = arg.split("=", 2)[1].split(",");
    } else if (arg.startsWith("--cwds=")) {
      cwds = arg.split("=", 2)[1].split(",");
    }
  }

  if (!roots || !cwds) {
    console.error(
      'Usage: npx hasset --roots="/path/to/scan1/,/path/to/scan2" --cwds="/location/to/do/the/replacement1/,/location/to/do/the/replacement2/"',
    );
    process.exit(1);
  }

  return { roots, cwds };
};

const main = async () => {
  const { roots, cwds } = parseArguments(process.argv.slice(2));

  try {
    console.log(`Generating hashes and updating file paths...`);
    console.log(`Scanning files in: ${roots}`);
    console.log(`Updating files in: ${cwds}`);

    await generateHashesAndReplace({
      roots,
      cwds,
    });

    console.log("Hash generation and file updates completed successfully.");
  } catch (error) {
    console.error(`Error occurred: ${error.message}`);
    process.exit(1);
  }
};

main();
