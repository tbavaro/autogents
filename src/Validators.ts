export abstract class Validator {
}

export class OrValidator extends Validator {
  public readonly validators: ReadonlyArray<Validator>;

  constructor(validators: Validator[]) {
    super();
    this.validators = validators;
  }
}

export class ObjectValidator extends Validator {
  public readonly propertyValidators: Readonly<{ [propertyName: string]: Validator }>;

  constructor(propertyValidators: { [propertyName: string]: Validator }) {
    super();
    this.propertyValidators = propertyValidators;
  }
}

export class TypeOfValidator extends Validator {
  public readonly typeOfString: string;

  constructor(typeOfString: string) {
    super();
    this.typeOfString = typeOfString;
  }
}

export const undefinedValidator: Validator = new class extends Validator {};
export const nullValidator: Validator = new class extends Validator {};
export const stringValidator: Validator = new TypeOfValidator("string");
export const numberValidator: Validator = new TypeOfValidator("number");
export const booleanValidator: Validator = new TypeOfValidator("boolean");
