import * as ts from "typescript";
import * as Test from "../inputs/test";
import * as TypescriptHelpers from "./TypescriptHelpers";
import * as Utils from "./Utils";
import ValidationGenerator from "./ValidationGenerator";
import { Validator } from "./Validators";

function run() {
  const rootName = "src/ValidationGenerator.TestTypes.ts";

  const generator = new ValidationGenerator([rootName]);

  console.log(`============ ${rootName}`);
  const allLazyValidators = generator.lazilyGenerateValidatorsFor(rootName);
  const validators = new Map<string, Validator<any>>();
  [
    "NumberFieldTestObject"
  ].forEach(key => {
    validators.set(key, (allLazyValidators.get(key) as any)());
  });

  const describedValidators = Utils.transformMapValues(validators, v => v.describe());
  console.log(JSON.stringify(Utils.mapToPOJO(describedValidators), null, 2));
}

run();
