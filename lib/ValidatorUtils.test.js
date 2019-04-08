"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validators = require("tsvalidators");
const ValidatorUtils = require("./ValidatorUtils");
it("initialization succeeds", () => {
    ValidatorUtils.forceInitialization();
});
it("spot-check validators", () => {
    const names = ValidatorUtils.validatorNames();
    expect(names).toContain("nullValidator");
    expect(names).toContain("stringValidator");
});
function testForValidator(attrs) {
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
function serialize(validator) {
    return ValidatorUtils.instantiate(validator, "V");
}
function testOptimize(attrs) {
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
    expectedOptimizedValidator: new Validators.OptionalValidator(new Validators.OrValidator([
        Validators.nullValidator,
        new Validators.ExactValueValidator([1, 2, 3])
    ]))
});
testOptimize({
    validator: new Validators.OrValidator([new Validators.ExactValueValidator(true), new Validators.ExactValueValidator(false)]),
    expectedOptimizedValidator: Validators.booleanValidator
});
testOptimize({
    validator: new Validators.OrValidator([new Validators.ExactValueValidator([true, false])]),
    expectedOptimizedValidator: Validators.booleanValidator
});
testOptimize({
    validator: new Validators.OrValidator([new Validators.ExactValueValidator([true, false, 1])]),
    expectedOptimizedValidator: new Validators.OrValidator([
        Validators.booleanValidator,
        new Validators.ExactValueValidator([1])
    ])
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVmFsaWRhdG9yVXRpbHMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9WYWxpZGF0b3JVdGlscy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQTJDO0FBQzNDLG1EQUFtRDtBQUVuRCxFQUFFLENBQUMseUJBQXlCLEVBQUUsR0FBRyxFQUFFO0lBQ2pDLGNBQWMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0FBQ3ZDLENBQUMsQ0FBQyxDQUFDO0FBRUgsRUFBRSxDQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRTtJQUMvQixNQUFNLEtBQUssR0FBRyxjQUFjLENBQUMsY0FBYyxFQUFFLENBQUM7SUFDOUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUN6QyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDN0MsQ0FBQyxDQUFDLENBQUM7QUFFSCxTQUFTLGdCQUFnQixDQUFDLEtBSXpCO0lBQ0MsRUFBRSxDQUFDLGFBQWEsS0FBSyxDQUFDLFdBQVcsRUFBRSxFQUFFLEdBQUcsRUFBRTtRQUN4QyxNQUFNLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzNFLENBQUMsQ0FBQyxDQUFDO0lBQ0gsRUFBRSxDQUFDLGdCQUFnQixLQUFLLENBQUMsV0FBVyxFQUFFLEVBQUUsR0FBRyxFQUFFO1FBQzNDLE1BQU0sQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3JGLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELGdCQUFnQixDQUFDO0lBQ2YsU0FBUyxFQUFF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