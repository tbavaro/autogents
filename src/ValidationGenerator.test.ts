import * as fs from "fs";
import * as os from "os";
import * as process from "process";
import ValidationGenerator from "./ValidationGenerator";
import { ValidationError, Validator } from "./Validators";

let generator: ValidationGenerator;
let validators: Map<string, () => Validator<any>>;

beforeAll(() => {
  const sourceFileName = "src/ValidationGenerator.TestTypes.ts";
  generator = new ValidationGenerator([sourceFileName]);
  validators = generator.lazilyGenerateValidatorsFor(sourceFileName);
});

afterAll(() => {
  generator = null as any;
  validators = null as any;
});

function getValidator<T>(symbol: string): Validator<T> {
  const validator = (validators.get(symbol) as () => Validator<T>)();
  expect(validator).toBeInstanceOf(Validator);
  return validator as Validator<T>;
}

function createInputTests(attrs: {
  symbol: string,
  validInputs: any[],
  invalidInputs: any[]
}) {
  attrs.validInputs.forEach(input => {
    const name = `valid input for "${attrs.symbol}": ${JSON.stringify(input)}`;
    it(name, () => {
      const validator = getValidator(attrs.symbol);
      expect(validator.validate(input)).toBe(input);
    });
  });

  attrs.invalidInputs.forEach(input => {
    const name = `invalid input for "${attrs.symbol}": ${JSON.stringify(input)}`;
    it(name, () => {
      const validator = getValidator(attrs.symbol);
      expect(() => validator.validate(input)).toThrowError(ValidationError);
    });
  });
}

createInputTests({
  symbol: "EmptyType",
  validInputs: [
    {},

    // extra variables are allowed for now
    { unexpected: 1 }
  ],
  invalidInputs: [
    undefined,
    null,
    [],
    ""
  ]
});

createInputTests({
  symbol: "NumberFieldTestObject",
  validInputs: [
    { aNumber: 1 },
    { aNumber: 0 }
  ],
  invalidInputs: [
    {},
    { aNumber: "not a number" },
    { aNumber: null },
    { aNumber: {} }
  ]
});

createInputTests({
  symbol: "StringFieldTestObject",
  validInputs: [
    { aString: "foo" },
    { aString: "" }
  ],
  invalidInputs: [
    {},
    { aString: 123 },
    { aString: null },
    { aString: {} }
  ]
});

createInputTests({
  symbol: "BooleanFieldTestObject",
  validInputs: [
    { aBoolean: true },
    { aBoolean: false }
  ],
  invalidInputs: [
    {},
    { aString: 123 },
    { aString: null },
    { aString: {} }
  ]
});

createInputTests({
  symbol: "OptionalFieldTestObject",
  validInputs: [
    {},
    { anOptionalNumber: 1 }
  ],
  invalidInputs: [
    { anOptionalNumber: "not a number" },
    { anOptionalNumber: null }
  ]
});
