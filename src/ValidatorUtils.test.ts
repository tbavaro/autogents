import * as Validators from "tsvalidators";
import * as ValidatorUtils from "./ValidatorUtils";

it("initialization succeeds", () => {
  ValidatorUtils.forceInitialization();
});

it("spot-check validators", () => {
  const names = ValidatorUtils.validatorNames();
  expect(names).toContain("nullValidator");
  expect(names).toContain("stringValidator");
});

function testForValidator(attrs: {
  validator: Validators.Validator,
  description: string,
  instantiation: string
}) {
  it(`describe: ${attrs.description}`, () => {
    expect(ValidatorUtils.describe(attrs.validator)).toBe(attrs.description);
  });
  it(`instantiate: ${attrs.description}`, () => {
    expect(ValidatorUtils.instantiate(attrs.validator, "V")).toBe(attrs.instantiation);
  });
}

testForValidator({
  validator: Validators.nullValidator,
  description: "nullValidator",
  instantiation: "V.nullValidator"
});

testForValidator({
  validator: new Validators.OrValidator([]),
  description: "OrValidator([])",
  instantiation: "new V.OrValidator([])"
});

testForValidator({
  validator: new Validators.OrValidator([Validators.nullValidator, Validators.numberValidator]),
  description: "OrValidator([nullValidator,numberValidator])",
  instantiation: "new V.OrValidator([V.nullValidator,V.numberValidator])"
});

testForValidator({
  validator: new Validators.OrValidator([
    Validators.undefinedValidator,
    new Validators.ExactValueValidator(1)
  ]),
  description: "OrValidator([undefinedValidator,ExactValueValidator([1])])",
  instantiation: "new V.OrValidator([V.undefinedValidator,new V.ExactValueValidator([1])])"
});

testForValidator({
  validator: new Validators.ExactValueValidator([1, "foo"]),
  description: "ExactValueValidator([1,\"foo\"])",
  instantiation: "new V.ExactValueValidator([1,\"foo\"])"
});

testForValidator({
  validator: new Validators.ObjectValidator({}),
  description: "ObjectValidator({})",
  instantiation: "new V.ObjectValidator({})"
});

testForValidator({
  validator: new Validators.ObjectValidator({
    a: Validators.nullValidator,
    b: new Validators.ExactValueValidator([1])
  }),
  description: "ObjectValidator({a:nullValidator,b:ExactValueValidator([1])})",
  instantiation: "new V.ObjectValidator({a:V.nullValidator,b:new V.ExactValueValidator([1])})"
});

testForValidator({
  validator: new ValidatorUtils.StubValidator("foo"),
  description: "StubValidator(\"foo\")",
  instantiation: "<StubValidator(\"foo\")>"
});

function serialize(validator: Validators.Validator): string {
  return ValidatorUtils.instantiate(validator, "V");
}

function testOptimize(attrs: {
  name?: string,
  validator: Validators.Validator,
  expectedOptimizedValidator: Validators.Validator
}) {
  attrs.name = attrs.name || ValidatorUtils.describe(attrs.validator);
  it(`optimize: ${attrs.name}`, () => {
    const optimizedValidator = ValidatorUtils.optimize(attrs.validator);
    expect(serialize(optimizedValidator)).toBe(serialize(attrs.expectedOptimizedValidator));
  });
}

testOptimize({
  validator: Validators.nullValidator,
  expectedOptimizedValidator: Validators.nullValidator
});

testOptimize({
  validator: new Validators.ExactValueValidator([1]),
  expectedOptimizedValidator: new Validators.ExactValueValidator([1])
});

testOptimize({
  validator: new Validators.OrValidator([]),
  expectedOptimizedValidator: new Validators.OrValidator([])
});

testOptimize({
  validator: new Validators.OrValidator([Validators.undefinedValidator]),
  expectedOptimizedValidator: Validators.undefinedValidator
});

testOptimize({
  validator: new Validators.OrValidator([Validators.undefinedValidator, Validators.undefinedValidator]),
  expectedOptimizedValidator: Validators.undefinedValidator
});

testOptimize({
  validator: new Validators.OrValidator([Validators.undefinedValidator, Validators.nullValidator]),
  expectedOptimizedValidator: new Validators.OptionalValidator(Validators.nullValidator)
});

testOptimize({
  validator: new Validators.OrValidator([Validators.undefinedValidator, Validators.numberValidator]),
  expectedOptimizedValidator: new Validators.OptionalValidator(Validators.numberValidator)
});

testOptimize({
  validator: new Validators.OrValidator([
    new Validators.ExactValueValidator([1]),
    new Validators.ExactValueValidator([2])
  ]),
  expectedOptimizedValidator: new Validators.ExactValueValidator([1, 2])
});

testOptimize({
  validator: new Validators.OrValidator([
    Validators.undefinedValidator,
    new Validators.ExactValueValidator([1]),
    new Validators.ExactValueValidator([2])
  ]),
  expectedOptimizedValidator: new Validators.OptionalValidator(new Validators.ExactValueValidator([1, 2]))
});

testOptimize({
  validator: new Validators.OrValidator([
    Validators.undefinedValidator,
    new Validators.ExactValueValidator([1]),
    new Validators.OrValidator([
      Validators.undefinedValidator,
      new Validators.ExactValueValidator([2])
    ])
  ]),
  expectedOptimizedValidator: new Validators.OptionalValidator(new Validators.ExactValueValidator([1, 2]))
});

testOptimize({
  validator: new Validators.OrValidator([
    Validators.undefinedValidator,
    new Validators.ExactValueValidator([1]),
    new Validators.OrValidator([
      Validators.undefinedValidator,
      Validators.nullValidator,
      new Validators.ExactValueValidator([2]),
      new Validators.ExactValueValidator([3])
    ])
  ]),
  expectedOptimizedValidator:
    new Validators.OptionalValidator(
      new Validators.OrValidator([
        Validators.nullValidator,
        new Validators.ExactValueValidator([1, 2, 3])
      ])
    )
});

// it("describe: OrValidator", () => {
//   const validator = new Validators.OrValidator([]);
//   expect(ValidatorUtils.describe(validator)).toBe("OrValidator");
// });

// it("describe: ExactValueValidator", () => {
//   const validator = new Validators.ExactValueValidator([1]);
//   expect(ValidatorUtils.describe(validator)).toBe("ExactValueValidator");
// });

// it("instantiate: ExactValueValidator", () => {
//   const validator = new Validators.ExactValueValidator([1]);
//   expect(ValidatorUtils.instantiate(validator, "V")).toBe("new V.ExactValueValidator([1])");
// });
