import * as ts from "typescript";
import * as TypescriptHelpers from "./TypescriptHelpers";

const typeIsObject = TypescriptHelpers.typeIsObject;

export abstract class Validator {
  public readonly validatorTypeName: string;

  constructor(validatorTypeName: string) {
    this.validatorTypeName = validatorTypeName;
  }

  public describe(): { [key: string]: {} } {
    let result = { type: this.validatorTypeName };
    const more = this.describeMore();
    if (more) {
      /* tslint:disable:prefer-object-spread */
      result = Object.assign(result, more);
    }
    return result;
  }

  protected describeMore(): { [key: string]: {} } | undefined {
    return undefined;
  }
}

export class OrValidator extends Validator {
  public readonly validators: Validator[];

  constructor(validators: Validator[]) {
    super("OrValidator");
    this.validators = validators;
  }

  protected describeMore() {
    return {
      validators: this.validators.map(validator => validator.describe())
    };
  }
}

export class ObjectValidator extends Validator {
  private propertyValidators: { [propertyName: string]: Validator };

  constructor(propertyValidators: { [propertyName: string]: Validator }) {
    super("ObjectValidator");
    this.propertyValidators = propertyValidators;
  }

  public describeMore() {
    const childDescriptions: any = {};
    Object.entries(this.propertyValidators).forEach(
      ([propertyName, validator]) => {
        childDescriptions[propertyName] = validator.describe();
      }
    );
    return {
      children: childDescriptions
    };
  }
}

class TypeOfValidator extends Validator {
  public readonly typeOfString: string;

  constructor(typeOfString: string) {
    super("TypeOfValidator");
    this.typeOfString = typeOfString;
  }

  protected describeMore() {
    return {
      typeOfString: this.typeOfString
    };
  }
}

export const undefinedValidator: Validator = new class extends Validator {
  constructor() {
    super("UndefinedValidator");
  }
}();

export const nullValidator: Validator = new class extends Validator {
  constructor() {
    super("NullValidator");
  }
}();

export const stringValidator: Validator = new TypeOfValidator("string");
export const numberValidator: Validator = new TypeOfValidator("number");
export const booleanValidator: Validator = new TypeOfValidator("boolean");
