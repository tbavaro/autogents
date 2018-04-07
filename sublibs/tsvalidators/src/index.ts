export class ValidationError extends Error {
  public readonly causes?: ValidationError[];

  constructor(msg: string, causes?: ValidationError[]) {
    super(msg);
    this.causes = causes;
  }
}

export abstract class Validator {
  // throws ValidationError if validation fails
  public abstract validate(input: any): void;

  public abstract describe(): { kind: string };

  protected static describeHelper(kind: string, otherProperties?: {}): { kind: string } {
    return { kind: kind, ...otherProperties };
  }
}

// TODO it's probably not good to use exceptions for "normal" cases like "or"
export class OrValidator extends Validator {
  public readonly validators: ReadonlyArray<Validator>;

  constructor(validators: Validator[]) {
    super();
    this.validators = validators;
  }

  public validate(input: any) {
    const failures: ValidationError[] = [];
    const succeeded =
      undefined !==
      this.validators.find(validator => {
        try {
          validator.validate(input);
          return true;
        } catch (e) {
          if (e instanceof ValidationError) {
            failures.push(e);
            return false;
          } else {
            throw e;
          }
        }
      });

    if (!succeeded) {
      throw new ValidationError("OrValidator failed", failures);
    }
  }

  public describe() {
    return Validator.describeHelper("OrValidator", {
      validators: this.validators.map(v => v.describe())
    });
  }
}

export class ObjectValidator extends Validator {
  public readonly propertyValidators: Readonly<{
    [propertyName: string]: Validator;
  }>;

  constructor(propertyValidators: { [propertyName: string]: Validator }) {
    super();
    this.propertyValidators = propertyValidators;
  }

  public validate(input: any) {
    // TODO maybe reject if we see any values that aren't supposed to be there

    if (typeof input !== "object" || input instanceof Array || input === null) {
      throw new ValidationError("ObjectValidator failed; not an object");
    }

    Object.entries(this.propertyValidators).forEach(
      ([propertyName, validator]) => {
        try {
          validator.validate(input[propertyName]);
        } catch (e) {
          if (e instanceof ValidationError) {
            throw new ValidationError(
              `ObjectValidator failed; property "${propertyName}"`,
              [e]
            );
          } else {
            throw e;
          }
        }
      }
    );
  }

  public describe() {
    const children: { [k: string]: {} } = {};
    for (const key of Object.keys(this.propertyValidators)) {
      const validator = this.propertyValidators[key];
      children[key] = validator.describe();
    }

    return Validator.describeHelper("ObjectValidator", {
      propertyValidators: children
    });
  }
}

export class TypeOfValidator extends Validator {
  public readonly typeOfString: string;

  constructor(typeOfString: string) {
    super();
    this.typeOfString = typeOfString;
  }

  public validate(input: any) {
    if (typeof input !== this.typeOfString) {
      throw new ValidationError("TypeOfValidator failed");
    }
  }

  public describe() {
    return Validator.describeHelper("TypeOfValidator", {
      typeOfString: this.typeOfString
    });
  }
}

export class ExactValueValidator extends Validator {
  public readonly value: Readonly<any>;

  constructor(value: any) {
    super();
    this.value = value;
  }

  public validate(input: any) {
    if (input !== this.value) {
      throw new ValidationError("ExactValueValidator failed");
    }
  }

  public describe() {
    return Validator.describeHelper("ExactValueValidator", {
      value: this.value
    });
  }
}

export const undefinedValidator: Validator = new ExactValueValidator(undefined);
export const nullValidator: Validator = new ExactValueValidator(null);
export const stringValidator: Validator = new TypeOfValidator("string");
export const numberValidator: Validator = new TypeOfValidator("number");
export const booleanValidator: Validator = new TypeOfValidator("boolean");

export function createValidationFunction<T>(validator: Validator): (input: any) => T {
  return (input => {
    validator.validate(input);
    return input as T;
  });
}
