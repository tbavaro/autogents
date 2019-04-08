#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const process = require("process");
const yargs = require("yargs");
const ValidationGenerator_1 = require("../ValidationGenerator");
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
const generator = new ValidationGenerator_1.default(sourceFileNames);
const result = generator.serializeValidators(argv.optimize);
const encoding = "utf-8";
if (argv.output) {
    fs.writeFileSync(argv.output, result, encoding);
}
else {
    process.stdout.write(result, encoding);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR2VuZXJhdGVWYWxpZGF0b3JzQXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2FwcHMvR2VuZXJhdGVWYWxpZGF0b3JzQXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLHlCQUF5QjtBQUN6QixtQ0FBbUM7QUFDbkMsK0JBQStCO0FBRS9CLGdFQUF5RDtBQUV6RCxNQUFNLE9BQU8sR0FBRyxLQUFLO0tBQ2xCLEtBQUssQ0FBQyxxQ0FBcUMsQ0FBQztLQUM1QyxPQUFPLENBQUMsS0FBSyxDQUFDO0tBQ2QsTUFBTSxDQUFDLFVBQVUsRUFBRTtJQUNsQixPQUFPLEVBQUUsSUFBSTtJQUNiLE9BQU8sRUFBRSxJQUFJO0lBQ2IsV0FBVyxFQUFFLGlCQUFpQjtDQUMvQixDQUFDO0tBQ0QsTUFBTSxDQUFDLFFBQVEsRUFBRTtJQUNoQixNQUFNLEVBQUUsSUFBSTtJQUNaLFdBQVcsRUFBRSx3Q0FBd0M7Q0FDdEQsQ0FBQyxDQUFDO0FBRUwsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztBQUMxQixNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBRS9CLElBQUksZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7SUFDOUIsT0FBTyxDQUFDLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0lBQzVDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDakI7QUFFRCxNQUFNLFNBQVMsR0FBRyxJQUFJLDZCQUFtQixDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBQzNELE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBYyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFFekUsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDO0FBQ3pCLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtJQUNmLEVBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7Q0FDakQ7S0FBTTtJQUNMLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztDQUN4QyJ9