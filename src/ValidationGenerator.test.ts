import { Validator } from "tsvalidators";
import * as Validators from "tsvalidators";
import ValidationGenerator from "./ValidationGenerator";
import { StubValidator } from "./ValidatorUtils";

let generator: ValidationGenerator;
const sourceFileName = "src/ValidationGenerator.TestTypes.ts";

beforeAll(() => {
  generator = new ValidationGenerator([sourceFileName]);
});

afterAll(() => {
  generator = null as any;
});

function getValidator(symbol: string): Validator {
  return generator.getValidator(sourceFileName, symbol);
}

import * as ValidatorUtils from "./ValidatorUtils";

function createInputTests(attrs: {
  symbol: string,
  directValidatorTest?: (validator: Validator) => void,
  validInputs: any[],
  invalidInputs: any[]
}) {
  const directValidatorTest = attrs.directValidatorTest;
  if (directValidatorTest) {
    it(`direct validator test for "${attrs.symbol}"`, () => {
      const validator = getValidator(attrs.symbol);
      directValidatorTest(validator);
    });
  }

  attrs.validInputs.forEach(input => {
    const name = `valid input for "${attrs.symbol}": ${JSON.stringify(input)}`;
    it(name, () => {
      const validator = getValidator(attrs.symbol);
      expect(validator.validate(input, "$")).toBe(Validators.ValidationOK);
    });
  });

  attrs.invalidInputs.forEach(input => {
    const name = `invalid input for "${attrs.symbol}": ${JSON.stringify(input)}`;
    it(name, () => {
      const validator = getValidator(attrs.symbol);
      expect(validator.validate(input, "$")).not.toBe(Validators.ValidationOK);
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

createInputTests({
  symbol: "NullableFieldTestObject",
  validInputs: [
    { aNullableNumber: 1 },
    { aNullableNumber: null }
  ],
  invalidInputs: [
    { },
    { aNullableNumber: undefined },
    { aNullableNumber: "not a number" }
  ]
});

createInputTests({
  symbol: "BooleanLiteralFieldTestObject",
  validInputs: [
    { mustBeFalse: false },
    { mustBeFalse: false, optionalTrue: true }
  ],
  invalidInputs: [
    {},
    { mustBeFalse: true },
    { mustBeFalse: false, optionalTrue: false }
  ]
});

createInputTests({
  symbol: "SwitchedUnionFieldTestObject",
  validInputs: [
    { isANumberNotAString: true, aNumber: 1 },
    { isANumberNotAString: false, aString: "hello" }
  ],
  invalidInputs: [
    {},
    { isANumberNotAString: true },
    { isANumberNotAString: false },
    { isANumberNotAString: false, aNumber: 1 },
    { isANumberNotAString: true, aString: "hello" }
  ]
});

createInputTests({
  symbol: "NumbersArrayTestObject",
  validInputs: [
    { numbers: [] },
    { numbers: [ 0 ] },
    { numbers: [ 1, 2, 3 ] }
  ],
  invalidInputs: [
    { numbers: [ "not a number" ] },
    { numbers: [ 1, "not a number" ] },
    { numbers: [ 1, "" ] },
    { numbers: [ 1, undefined ] },
  ]
});

createInputTests({
  symbol: "NumbersAndOrStringsArrayTestObject",
  validInputs: [
    { numbersAndOrStrings: [] },
    { numbersAndOrStrings: [ 1 ] },
    { numbersAndOrStrings: [ 1, 2, 3 ] },
    { numbersAndOrStrings: [ "not a number" ] },
    { numbersAndOrStrings: [ 1, "not a number" ] },
    { numbersAndOrStrings: [ 1, "" ] }
  ],
  invalidInputs: [
    { numbersAndOrStrings: [ 1, undefined ] },
    { numbersAndOrStrings: [ {} ] }
  ]
});

createInputTests({
  symbol: "JustANumberAlias",
  directValidatorTest: (validator => {
    expect(validator).toBeInstanceOf(Validators.TypeOfValidator);
  }),
  validInputs: [
    1,
    0
  ],
  invalidInputs: [
    {},
    null,
    undefined
  ]
});

createInputTests({
  symbol: "AnonymousNestedObjectTestObject",
  validInputs: [
    { anObject: { aNumber: 1 } }
  ],
  invalidInputs: [
    {},
    { anObject: null },
    { anObject: {} }
  ]
});

createInputTests({
  symbol: "SelfReferencingTestObject",
  validInputs: [
    { aNumber: 1 },
    { aNumber: 1, anOptionalMe: { aNumber: 2 } },
    { aNumber: 1, anOptionalMe: { aNumber: 2, anOptionalMe: { aNumber: 3 } } }
  ],
  invalidInputs: [
    {},
    { aNumber: 1, anOptionalMe: {} },
    { aNumber: 1, anOptionalMe: { aNumber: 2, anOptionalMe: {} } }
  ]
});

createInputTests({
  symbol: "CycleTestObject1",
  validInputs: [
    { aNumber: 1 },
    { aNumber: 1, anOptional2: { aString: "foo" } },
    { aNumber: 1, anOptional2: { aString: "foo", anOptional1: { aNumber: 3 } } },
    { aNumber: 1, anOptional2: { aString: "foo", anOptional1: { aNumber: 3, anOptional2: { aString: "bar" } } } }
  ],
  invalidInputs: [
    {},
    { aNumber: 1, anOptional2: { aNumber: 2 } }
  ]
});

createInputTests({
  symbol: "NumberLiteralObject",
  validInputs: [
    1
  ],
  invalidInputs: [
    null,
    0,
    "foo"
  ]
});

createInputTests({
  symbol: "StringLiteralObject",
  validInputs: [
    "foo"
  ],
  invalidInputs: [
    null,
    0,
    "bar"
  ]
});

createInputTests({
  symbol: "MultipleStringLiteralObject",
  validInputs: [
    "foo",
    "bar"
  ],
  invalidInputs: [
    null,
    0,
    "baz"
  ]
});

it("pure alias types reuse the validator for the thing it's aliasing", () => {
  const originalValidator = getValidator("NumberFieldTestObject");
  const aliasValidator = getValidator("NumberFieldTestObjectAlias");

  // if they are exactly equal then they'll get serialized the same;
  // we want the original one to get serialized in full and have the alias just
  // reference the original
  expect(originalValidator).not.toBe(aliasValidator);
  expect(aliasValidator).toBeInstanceOf(StubValidator);
  expect((aliasValidator as StubValidator).delegate).toBe(originalValidator);
});

function testValidatorGeneration(attrs: {
  symbol: string,
  expectedValidator: Validator,
  extraName?: string
}) {
  const name = `generate: ${attrs.symbol}` + (attrs.extraName ? ` (${attrs.extraName})` : "");
  it(name, () => {
    const validator = getValidator(attrs.symbol);
    expect(ValidatorUtils.describe(validator)).toBe(ValidatorUtils.describe(attrs.expectedValidator));
  });
}

testValidatorGeneration({
  symbol: "UsesNullableFieldTestObject",
  expectedValidator: new Validators.ObjectValidator({
    anObject: new ValidatorUtils.StubValidator("NumberFieldTestObject")
  })
});

testValidatorGeneration({
  symbol: "UsesMultipleStringLiteralObject",
  expectedValidator: new Validators.ObjectValidator({
    anObject: new ValidatorUtils.StubValidator("MultipleStringLiteralObject")
  })
});

// TODO: couldn't find a way to keep this from being inlined :(
// testValidatorGeneration({
//   symbol: "UsesOptionalMultipleStringLiteralObject",
//   expectedValidator: new Validators.ObjectValidator({
//     anObject: new ValidatorUtils.StubValidator("MultipleStringLiteralObject")
//   })
// });
