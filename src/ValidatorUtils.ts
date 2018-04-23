import * as Validators from "tsvalidators";
import { Validator } from "tsvalidators";
import { isArray, isObject } from "util";

import * as Utils from "./Utils";

type ValidatorEntry<T extends Validator> = {
  predicate: (validator: Validator) => boolean;
  name: string;
  isSingleton: boolean;
  describe: (validator: T) => string;
  createInstantiationCall: (validator: T, moduleName: string) => string;
};

function isValidator(value: any): value is Validator {
  return (value && typeof value === "object" && ("validate" in value));
}

function assertIsValidator(value: any): Validator {
  if (!isValidator(value)) {
    throw new Error("expected validator, got: " + value);
  } else {
    return value;
  }
}

function findSingletonValidatorNames() {
  return Object.keys(Validators).filter(key => isValidator((Validators as any)[key]));
}

function findValidatorClassNames() {
  return Object.keys(Validators).filter(key => {
    const value = (Validators as any)[key];
    return (value instanceof Function && isValidator(value.prototype));
  });
}

function serializeOrCallValidatorTransform(value: any, transform: (v: Validator) => string): string {
  if (isValidator(value)) {
    return transform(value);
  } else if (isArray(value)) {
    return "[" + value.map(v => serializeOrCallValidatorTransform(v, transform)).join(",") + "]";
  } else if (isObject(value)) {
    const entries: string[] = Object.keys(value).map(key => {
      const escapedKey = (/^[a-z]+$/i.test(key) ? key : JSON.stringify(key));
      const v = value[key];
      return `${escapedKey}:${serializeOrCallValidatorTransform(v, transform)}`;
    });
    return `{${entries.join(",")}}`;
  } else {
    return JSON.stringify(value);
  }
}

// NB: assumes that validators only have one field, and they are in the same order
// as constructor args
function getConstructorArguments(v: Validator): any[] {
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
  const entries: Array<ValidatorEntry<any>> = [];
  findSingletonValidatorNames().forEach(name => {
    const validator = assertIsValidator((Validators as any)[name]);
    entries.push({
      predicate: (v: Validator) => v === validator,
      name: name,
      isSingleton: true,
      describe: () => name,
      createInstantiationCall: (_, moduleName: string) => `${moduleName}.${name}`
    });
  });
  findValidatorClassNames().forEach(name => {
    const vClass = (Validators as any)[name];
    entries.push({
      predicate: (v: Validator) => v instanceof vClass,
      name: name,
      isSingleton: false,
      describe: (v: Validator) => {
        const values = Object.values(v);
        const serializedValues = serializeOrCallValidatorTransform(values, innerV => describe(innerV));
        return `${name}(${serializedValues.slice(1, serializedValues.length - 1)})`;
      },
      createInstantiationCall: (v: Validator, moduleName: string) => {
        const constructorParams = getConstructorArguments(v);
        const serializedConstructorParams =
          constructorParams.map(p => serializeOrCallValidatorTransform(
            p,
            innerValidator => getEntryForValidator(innerValidator).createInstantiationCall(innerValidator, moduleName)
          )).join(",");
        return `new ${moduleName}.${name}(${serializedConstructorParams})`;
      }
    });
  });
  entries.push({
    predicate: (v: Validator) => v instanceof StubValidator,
    name: "StubValidator",
    isSingleton: false,
    describe: (v: StubValidator) => v.describe(),
    createInstantiationCall: (v: StubValidator, moduleName: string) => v.createInstantiationCall()
  });
  return entries;
});

function getEntryForValidator<T extends Validator>(validator: T): ValidatorEntry<T> {
  const result = getOrCreateEntries().find(e => e.predicate(validator));
  if (result === undefined) {
    throw new Error("unable to find validator for: " + validator);
  } else {
    return result;
  }
}

// for testing
export function forceInitialization() {
  getOrCreateEntries();
}

export function describe(validator: Validator): string {
  return getEntryForValidator(validator).describe(validator);
}

export function instantiate(validator: Validator, moduleName: string): string {
  return getEntryForValidator(validator).createInstantiationCall(validator, moduleName);
}

export function validatorNames(): string[] {
  return getOrCreateEntries().map(e => e.name);
}

// these get replaced by stub references in the generated output
export class StubValidator implements Validator {
  private privateDelegate?: Validator;

  public readonly key: string;

  set delegate(validator: Validator) {
    if (this.privateDelegate !== undefined && this.privateDelegate !== validator) {
      throw new Error("delegate can't be set twice");
    } else {
      this.privateDelegate = validator;
    }
  }

  get delegate(): Validator {
    if (this.privateDelegate === undefined) {
      throw new Error("delegate is not set");
    } else {
      return this.privateDelegate;
    }
  }

  constructor(key: string) {
    this.key = key;
  }

  public validate(input: any, path: string) {
    return this.delegate.validate(input, path);
  }

  public describe() {
    return `StubValidator(${JSON.stringify(this.key)})`;
  }

  public createInstantiationCall() {
    return `<${this.describe()}>`;
  }

  // TODO see if it's possible to make the key be exactly the final variable name, bypassing
  // the need to do the remapping; will still need to search for references though if we want
  // to optimize away unreferenced stubs
  public static swapAndRecordReferences(
    str: string,
    referencedUniqueIds: Set<string>,
    uniqueIdToVariableNameMap: Map<string, string>
  ) {
    return str.replace(/<StubValidator\(([^\)]*)\)>/g, (_, match) => {
      match = JSON.parse(match);
      const result = uniqueIdToVariableNameMap.get(match);
      if (result === undefined) {
        throw new Error(`no variable name found for key: ${match}`);
      } else {
        referencedUniqueIds.add(match);
        return `stubs.${result}`;
      }
    });
  }
}

function optimizeOrValidator(validator: Validators.OrValidator): Validator {
  let isOptional = false;
  const exactValues = new Set<any>();
  const otherValidators = new Set<Validator>();

  const remainingValidators = [ ...validator.validators ];
  while(remainingValidators.length > 0) {
    let v = Utils.assertDefined(remainingValidators.shift());
    v = optimize(v);
    if (v instanceof Validators.OptionalValidator) {
      isOptional = true;
      v = v.delegate;
    }
    if (v === Validators.undefinedValidator) {
      isOptional = true;
    } else if (v instanceof Validators.ExactValueValidator) {
      if (getEntryForValidator(v).isSingleton) {
        otherValidators.add(v);
      } else {
        v.values.forEach(e => {
          if (e === undefined) {
            isOptional = true;
          } else {
            exactValues.add(e);
          }
        });
      }
    } else if (v instanceof Validators.OrValidator) {
      Utils.pushAll(remainingValidators, v.validators);
    } else {
      otherValidators.add(v);
    }
  }

  if (exactValues.size > 0) {
    otherValidators.add(new Validators.ExactValueValidator(Array.from(exactValues)));
  }

  // special case: was just Or([undefined])
  if (otherValidators.size === 0 && isOptional) {
    return Validators.undefinedValidator;
  }

  const otherValidatorsArray = Array.from(otherValidators);

  const newValidator: Validator = (
    otherValidatorsArray.length === 1
      ? otherValidatorsArray[0]
      : new Validators.OrValidator(otherValidatorsArray)
  );

  return isOptional ? new Validators.OptionalValidator(newValidator) : newValidator;
}

function optimizeMaybeValidatorLike(value: any): any {
  if (isValidator(value)) {
    return optimize(value);
  } else if (isArray(value)) {
    return value.map(optimizeMaybeValidatorLike);
  } else if (isObject(value)) {
    const result: { [key: string]: any } = {};
    Object.keys(value).forEach(key => {
      result[key] = optimizeMaybeValidatorLike(value[key]);
    });
    return result;
  } else {
    return value;
  }
}

export function optimize(validator: Validator): Validator {
  if (validator instanceof Validators.OrValidator) {
    return optimizeOrValidator(validator);
  } else if (validator instanceof StubValidator) {
    return validator;
  } else {
    const entry = getEntryForValidator(validator);
    if (entry.isSingleton) {
      // assume singleton validators are already optimized
      return validator;
    } else {
      const params = getConstructorArguments(validator).map(optimizeMaybeValidatorLike);
      const obj = {};
      const prototype = Object.getPrototypeOf(validator);
      Object.setPrototypeOf(obj, prototype);
      prototype.constructor.apply(obj, params);
      return obj as Validator;
    }
  }
}
