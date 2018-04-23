#!/usr/bin/env node

import * as fs from "fs";
import * as process from "process";
import * as yargs from "yargs";

import ValidationGenerator from "../ValidationGenerator";

const myYargs = yargs
  .usage("Usage: $0 [options] source_file ...")
  .version(false)
  .option("optimize", {
    boolean: true,
    default: true,
    description: "Optimize output"
  })
  .option("output", {
    string: true,
    description: "Output filename (as opposed to stdout)"
  });

const argv = myYargs.argv;
const sourceFileNames = argv._;

if (sourceFileNames.length < 1) {
  console.error("No source files specified.");
  process.exit(1);
}

const generator = new ValidationGenerator(sourceFileNames);
const result = generator.serializeValidators(/*optimize=*/argv.optimize);

const encoding = "utf-8";
if (argv.output) {
  fs.writeFileSync(argv.output, result, encoding);
} else {
  process.stdout.write(result, encoding);
}
