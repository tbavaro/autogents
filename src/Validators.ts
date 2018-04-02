export class ValidationError extends Error {
  public readonly cause?: ValidationError;

  constructor(msg: string, cause?: ValidationError) {
    super(msg);
    this.cause = cause;
  }
}

export abstract class Validator<T> {
  // throws ValidationError if validation fails
  public abstract validate(input: any): T;
}

// TODO it's probably not good to use exceptions for "normal" cases like "or"
export class OrValidator extends Validator<any> {
  public readonly validators: ReadonlyArray<Validator<any>>;

  constructor(validators: Array<Validator<any>>) {
    super();
    this.validators = validators;
  }

  public validate(input: any): any {
    const succeeded =
      undefined !==
      this.validators.find(validator => {
        try {
          validator.validate(input);
          return true;
        } catch (e) {
          if (e instanceof ValidationError) {
            return false;
          } else {
            throw e;
          }
        }
      });

    if (!succeeded) {
      throw new ValidationError("OrValidator failed");
    }

    return input;
  }
}

export class ObjectValidator<T> extends Validator<T> {
  public readonly propertyValidators: Readonly<{
    [propertyName: string]: Validator<any>;
  }>;

  constructor(propertyValidators: { [propertyName: string]: Validator<any> }) {
    super();
    this.propertyValidators = propertyValidators;
  }

  public validate(input: any): T {
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
              e
            );
          } else {
            throw e;
          }
        }
      }
    );

    return input as T;
  }
}

export class TypeOfValidator<T> extends Validator<T> {
  public readonly typeOfString: string;

  constructor(typeOfString: string) {
    super();
    this.typeOfString = typeOfString;
  }

  public validate(input: any): T {
    if (typeof input !== this.typeOfString) {
      throw new ValidationError("TypeOfValidator failed");
    }
    return input as T;
  }
}

export class ExactValueValidator<T> extends Validator<T> {
  public readonly value: Readonly<T>;

  constructor(value: T) {
    super();
    this.value = value;
  }

  public validate(input: any): T {
    if (input !== this.value) {
      throw new ValidationError("ExactValueValidator failed");
    }
    return input as T;
  }
}

export const undefinedValidator: Validator<undefined> = new ExactValueValidator(
  undefined
);
export const nullValidator: Validator<null> = new ExactValueValidator(null);
export const stringValidator: Validator<string> = new TypeOfValidator("string");
export const numberValidator: Validator<number> = new TypeOfValidator("number");
export const booleanValidator: Validator<boolean> = new TypeOfValidator(
  "boolean"
);
