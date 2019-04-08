"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validators = require("tsvalidators");
const ValidationGenerator_1 = require("./ValidationGenerator");
const ValidatorUtils_1 = require("./ValidatorUtils");
let generator;
const sourceFileName = "src/ValidationGenerator.TestTypes.ts";
beforeAll(() => {
    generator = new ValidationGenerator_1.default([sourceFileName]);
});
afterAll(() => {
    generator = null;
});
function getValidator(symbol) {
    return generator.getValidator(sourceFileName, symbol);
}
const ValidatorUtils = require("./ValidatorUtils");
function createInputTests(attrs) {
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
        {},
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
        { numbers: [0] },
        { numbers: [1, 2, 3] }
    ],
    invalidInputs: [
        { numbers: ["not a number"] },
        { numbers: [1, "not a number"] },
        { numbers: [1, ""] },
        { numbers: [1, undefined] },
    ]
});
createInputTests({
    symbol: "NumbersAndOrStringsArrayTestObject",
    validInputs: [
        { numbersAndOrStrings: [] },
        { numbersAndOrStrings: [1] },
        { numbersAndOrStrings: [1, 2, 3] },
        { numbersAndOrStrings: ["not a number"] },
        { numbersAndOrStrings: [1, "not a number"] },
        { numbersAndOrStrings: [1, ""] }
    ],
    invalidInputs: [
        { numbersAndOrStrings: [1, undefined] },
        { numbersAndOrStrings: [{}] }
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
    expect(originalValidator).not.toBe(aliasValidator);
    expect(aliasValidator).toBeInstanceOf(ValidatorUtils_1.StubValidator);
    expect(aliasValidator.delegate).toBe(originalValidator);
});
function testValidatorGeneration(attrs) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVmFsaWRhdGlvbkdlbmVyYXRvci50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1ZhbGlkYXRpb25HZW5lcmF0b3IudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLDJDQUEyQztBQUMzQywrREFBd0Q7QUFDeEQscURBQWlEO0FBRWpELElBQUksU0FBOEIsQ0FBQztBQUNuQyxNQUFNLGNBQWMsR0FBRyxzQ0FBc0MsQ0FBQztBQUU5RCxTQUFTLENBQUMsR0FBRyxFQUFFO0lBQ2IsU0FBUyxHQUFHLElBQUksNkJBQW1CLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO0FBQ3hELENBQUMsQ0FBQyxDQUFDO0FBRUgsUUFBUSxDQUFDLEdBQUcsRUFBRTtJQUNaLFNBQVMsR0FBRyxJQUFXLENBQUM7QUFDMUIsQ0FBQyxDQUFDLENBQUM7QUFFSCxTQUFTLFlBQVksQ0FBQyxNQUFjO0lBQ2xDLE9BQU8sU0FBUyxDQUFDLFlBQVksQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDeEQsQ0FBQztBQUVELG1EQUFtRDtBQUVuRCxTQUFTLGdCQUFnQixDQUFDLEtBS3pCO0lBQ0MsTUFBTSxtQkFBbUIsR0FBRyxLQUFLLENBQUMsbUJBQW1CLENBQUM7SUFDdEQsSUFBSSxtQkFBbUIsRUFBRTtRQUN2QixFQUFFLENBQUMsOEJBQThCLEtBQUssQ0FBQyxNQUFNLEdBQUcsRUFBRSxHQUFHLEVBQUU7WUFDckQsTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM3QyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNqQyxDQUFDLENBQUMsQ0FBQztLQUNKO0lBRUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDaEMsTUFBTSxJQUFJLEdBQUcsb0JBQW9CLEtBQUssQ0FBQyxNQUFNLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxL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