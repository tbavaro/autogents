#!/usr/bin/env node

import * as yargs from "yargs";

const argv = yargs
  .option("foo", {})
  .argv;

console.log(argv);
