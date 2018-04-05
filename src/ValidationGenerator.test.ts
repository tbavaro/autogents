import * as fs from "fs";
import * as os from "os";
import * as process from "process";
import ValidationGenerator from "./ValidationGenerator";
import { ValidationError, Validator } from "./Validators";

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

function createInputTests(attrs: {
  symbol: string,
  validInputs: any[],
  invalidInputs: any[]
}) {
  attrs.validInputs.forEach(input => {
    const name = `valid input for "${attrs.symbol}": ${JSON.stringify(input)}`;
    it(name, () => {
      const validator = getValidator(attrs.symbol);
      expect(() => validator.validate(input)).not.toThrow();
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
  symbol: "JustANumberAlias",
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
})