"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validators = require("tsvalidators");
const util_1 = require("util");
const Utils = require("./Utils");
function isValidator(value) {
    return (value && typeof value === "object" && ("validate" in value));
}
function assertIsValidator(value) {
    if (!isValidator(value)) {
        throw new Error("expected validator, got: " + value);
    }
    else {
        return value;
    }
}
function findSingletonValidatorNames() {
    return Object.keys(Validators).filter(key => isValidator(Validators[key]));
}
function findValidatorClassNames() {
    return Object.keys(Validators).filter(key => {
        const value = Validators[key];
        return (value instanceof Function && isValidator(value.prototype));
    });
}
function serializeOrCallValidatorTransform(value, transform) {
    if (isValidator(value)) {
        return transform(value);
    }
    else if (util_1.isArray(value)) {
        return "[" + value.map(v => serializeOrCallValidatorTransform(v, transform)).join(",") + "]";
    }
    else if (util_1.isObject(value)) {
        const entries = Object.keys(value).map(key => {
            const escapedKey = (/^[a-z]+$/i.test(key) ? key : JSON.stringify(key));
            const v = value[key];
            return `${escapedKey}:${serializeOrCallValidatorTransform(v, transform)}`;
        });
        return `{${entries.join(",")}}`;
    }
    else {
        return JSON.stringify(value);
    }
}
function getConstructorArguments(v) {
    const values = Object.values(v);
    switch (values.length) {
        case 0:
        case 1:
            return values;
        default:
            throw new Error("multiple fields not supported");
    }
}
const getOrCreateEntries = Utils.lazyInitialize(() => {
    const entries = [];
    findSingletonValidatorNames().forEach(name => {
        const validator = assertIsValidator(Validators[name]);
        entries.push({
            predicate: (v) => v === validator,
            name: name,
            isSingleton: true,
            describe: () => name,
            createInstantiationCall: (_, moduleName) => `${moduleName}.${name}`
        });
    });
    findValidatorClassNames().forEach(name => {
        const vClass = Validators[name];
        entries.push({
            predicate: (v) => v instanceof vClass,
            name: name,
            isSingleton: false,
            describe: (v) => {
                const values = Object.values(v);
                const serializedValues = serializeOrCallValidatorTransform(values, innerV => describe(innerV));
                return `${name}(${serializedValues.slice(1, serializedValues.length - 1)})`;
            },
            createInstantiationCall: (v, moduleName) => {
                const constructorParams = getConstructorArguments(v);
                const serializedConstructorParams = constructorParams.map(p => serializeOrCallValidatorTransform(p, innerValidator => getEntryForValidator(innerValidator).createInstantiationCall(innerValidator, moduleName))).join(",");
                return `new ${moduleName}.${name}(${serializedConstructorParams})`;
            }
        });
    });
    entries.push({
        predicate: (v) => v instanceof StubValidator,
        name: "StubValidator",
        isSingleton: false,
        describe: (v) => v.describe(),
        createInstantiationCall: (v, moduleName) => v.createInstantiationCall()
    });
    return entries;
});
function getEntryForValidator(validator) {
    const result = getOrCreateEntries().find(e => e.predicate(validator));
    if (result === undefined) {
        throw new Error("unable to find validator for: " + validator);
    }
    else {
        return result;
    }
}
function forceInitialization() {
    getOrCreateEntries();
}
exports.forceInitialization = forceInitialization;
function describe(validator) {
    return getEntryForValidator(validator).describe(validator);
}
exports.describe = describe;
function instantiate(validator, moduleName) {
    return getEntryForValidator(validator).createInstantiationCall(validator, moduleName);
}
exports.instantiate = instantiate;
function validatorNames() {
    return getOrCreateEntries().map(e => e.name);
}
exports.validatorNames = validatorNames;
class StubValidator {
    set delegate(validator) {
        if (this.privateDelegate !== undefined && this.privateDelegate !== validator) {
            throw new Error("delegate can't be set twice");
        }
        else {
            this.privateDelegate = validator;
        }
    }
    get delegate() {
        if (this.privateDelegate === undefined) {
            throw new Error("delegate is not set");
        }
        else {
            return this.privateDelegate;
        }
    }
    constructor(key) {
        this.key = key;
    }
    validate(input, path) {
        return this.delegate.validate(input, path);
    }
    describe() {
        return `StubValidator(${JSON.stringify(this.key)})`;
    }
    createInstantiationCall() {
        return `<${this.describe()}>`;
    }
    static swapAndRecordReferences(str, referencedUniqueIds, uniqueIdToVariableNameMap) {
        return str.replace(/<StubValidator\(([^\)]*)\)>/g, (_, match) => {
            match = JSON.parse(match);
            const result = uniqueIdToVariableNameMap.get(match);
            if (result === undefined) {
                throw new Error(`no variable name found for key: ${match}`);
            }
            else {
                referencedUniqueIds.add(match);
                return `stubs.${result}`;
            }
        });
    }
}
exports.StubValidator = StubValidator;
function optimizeOrValidator(validator) {
    let isOptional = false;
    const exactValues = new Set();
    const otherValidators = new Set();
    const remainingValidators = [...validator.validators];
    while (remainingValidators.length > 0) {
        let v = Utils.assertDefined(remainingValidators.shift());
        v = optimize(v);
        if (v instanceof Validators.OptionalValidator) {
            isOptional = true;
            v = v.delegate;
        }
        if (v === Validators.undefinedValidator) {
            isOptional = true;
        }
        else if (v instanceof Validators.ExactValueValidator) {
            if (getEntryForValidator(v).isSingleton) {
                otherValidators.add(v);
            }
            else {
                v.values.forEach(e => {
                    if (e === undefined) {
                        isOptional = true;
                    }
                    else {
                        exactValues.add(e);
                    }
                });
            }
        }
        else if (v instanceof Validators.OrValidator) {
            Utils.pushAll(remainingValidators, v.validators);
        }
        else {
            otherValidators.add(v);
        }
    }
    if (exactValues.has(true) && exactValues.has(false)) {
        otherValidators.add(Validators.booleanValidator);
        exactValues.delete(true);
        exactValues.delete(false);
    }
    if (exactValues.size > 0) {
        otherValidators.add(new Validators.ExactValueValidator(Array.from(exactValues)));
    }
    if (otherValidators.size === 0 && isOptional) {
        return Validators.undefinedValidator;
    }
    const otherValidatorsArray = Array.from(otherValidators);
    const newValidator = (otherValidatorsArray.length === 1
        ? otherValidatorsArray[0]
        : new Validators.OrValidator(otherValidatorsArray));
    return isOptional ? new Validators.OptionalValidator(newValidator) : newValidator;
}
function optimizeExactValueValidator(validator) {
    const values = new Set(validator.values);
    if (values.has(true) && values.has(false)) {
        values.delete(true);
        values.delete(false);
        if (values.size === 0) {
            return Validators.booleanValidator;
        }
        else {
            return new Validators.OrValidator([
                Validators.booleanValidator,
                new Validators.ExactValueValidator(Array.from(values))
            ]);
        }
    }
    return new Validators.ExactValueValidator(Array.from(values));
}
function optimizeMaybeValidatorLike(value) {
    if (isValidator(value)) {
        return optimize(value);
    }
    else if (util_1.isArray(value)) {
        return value.map(optimizeMaybeValidatorLike);
    }
    else if (util_1.isObject(value)) {
        const result = {};
        Object.keys(value).forEach(key => {
            result[key] = optimizeMaybeValidatorLike(value[key]);
        });
        return result;
    }
    else {
        return value;
    }
}
function optimize(validator) {
    if (validator instanceof Validators.OrValidator) {
        return optimizeOrValidator(validator);
    }
    else if (validator instanceof StubValidator) {
        return validator;
    }
    else {
        const entry = getEntryForValidator(validator);
        if (entry.isSingleton) {
            return validator;
        }
        else if (validator instanceof Validators.ExactValueValidator) {
            return optimizeExactValueValidator(validator);
        }
        else {
            const params = getConstructorArguments(validator).map(optimizeMaybeValidatorLike);
            const obj = {};
            const prototype = Object.getPrototypeOf(validator);
            Object.setPrototypeOf(obj, prototype);
            prototype.constructor.apply(obj, params);
            return obj;
        }
    }
}
exports.optimize = optimize;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVmFsaWRhdG9yVXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvVmFsaWRhdG9yVXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyQ0FBMkM7QUFFM0MsK0JBQXlDO0FBRXpDLGlDQUFpQztBQVVqQyxTQUFTLFdBQVcsQ0FBQyxLQUFVO0lBQzdCLE9BQU8sQ0FBQyxLQUFLLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLENBQUMsVUFBVSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDdkUsQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQUMsS0FBVTtJQUNuQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ3ZCLE1BQU0sSUFBSSxLQUFLLENBQUMsMkJBQTJCLEdBQUcsS0FBSyxDQUFDLENBQUM7S0FDdEQ7U0FBTTtRQUNMLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7QUFDSCxDQUFDO0FBRUQsU0FBUywyQkFBMkI7SUFDbEMsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxVQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0RixDQUFDO0FBRUQsU0FBUyx1QkFBdUI7SUFDOUIsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUMxQyxNQUFNLEtBQUssR0FBSSxVQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLE9BQU8sQ0FBQyxLQUFLLFlBQVksUUFBUSxJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUNyRSxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxTQUFTLGlDQUFpQyxDQUFDLEtBQVUsRUFBRSxTQUFtQztJQUN4RixJQUFJLFdBQVcsQ0FBQyxL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