import * as ts from "typescript";
import * as TypescriptHelpers from "./TypescriptHelpers";
// import * as Utils from "./Utils";
import ValidationGenerator from "./ValidationGenerator";
// import { Validator } from "./Validators";

function run() {
  const rootName = "src/ValidationGenerator.TestTypes.ts";

  console.log(TypescriptHelpers.syntaxKindToString(ts.SyntaxKind.ArrowFunction));
  const generator = new ValidationGenerator([rootName]);

  // console.log(`============ ${rootName}`);
  // const validators = new Map<string, Validator<any>>();
  // [
  //   "SelfReferencingTestObject"
  // ].forEach(key => {
  //   validators.set(key, generator.getValidator(rootName, key));
  // });

  // const describedValidators = Utils.transformMapValues(validators, v => v.describe());
  // console.log(JSON.stringify(Utils.mapToPOJO(describedValidators), null, 2));

  console.log(generator.serializeValidators());
}

run();
