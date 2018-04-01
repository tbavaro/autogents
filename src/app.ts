import * as ts from "typescript";
import * as TypescriptHelpers from "./TypescriptHelpers";
import ValidationGenerator from "./ValidationGenerator";

function run() {
  const rootNames = ["inputs/test.ts"];

  const generator = new ValidationGenerator(rootNames);

  rootNames.forEach(rootName => {
    console.log(`============ ${rootName}`);
    const validators = generator.generateValidatorsFor(rootName);
    const describedValidators: { [propertyName: string]: {} } = {};
    Object.entries(validators).forEach(([propertyName, validator]) => {
      describedValidators[propertyName] = validator.describe();
    });
    console.log(JSON.stringify(describedValidators, null, 2));
  });
}

run();
