import * as ts from "typescript";
import * as Test from "../inputs/test";
import * as TypescriptHelpers from "./TypescriptHelpers";
import ValidationGenerator from "./ValidationGenerator";
import * as ValidatorHelpers from "./ValidatorHelpers";
import { ObjectValidator } from "./Validators";

function run() {
  const rootName = "inputs/test.ts";

  const generator = new ValidationGenerator([rootName]);

  console.log(`============ ${rootName}`);
  const validators = generator.generateValidatorsFor(rootName);
  const describedValidators: { [propertyName: string]: {} } = {};
  Object.entries(validators).forEach(([propertyName, validator]) => {
    describedValidators[
      propertyName
    ] = ValidatorHelpers.describeValidatorAsPOJO(validator);
  });
  console.log(JSON.stringify(describedValidators, null, 2));

  /* tslint:disable */
  const fooValidator = validators["Foo"] as
    | ObjectValidator<Test.Foo>
    | undefined;
  /* tslint:enable */

  if (fooValidator === undefined) {
    throw new Error("no foo validator");
  }

  fooValidator.validate({
    aString: "hey",
    aStringOrNull: null,
    aNumber: 123
  });
}

run();
