import * as Validators from "./Validators";

function mapPOJO<V1, V2>(
  input: { [key: string]: V1 },
  transform: (value: V1, key: string) => V2
): { [key: string]: V2 } {
  const output: { [key: string]: V2 } = {};
  Object.entries(input).forEach(([key, value]: [string, V1]) => {
    output[key] = transform(value, key);
  });
  return output;
}

type ValidatorHelperEntry<T extends Validators.Validator<any>> = {
  validatorOrType: T | (typeof Validators.Validator);
  describeAsPOJO: (validator: T) => {};
};

function makeValidatorHelper<
  T extends Validators.Validator<any>,
  U /*extends typeof T */
>(
  validatorOrType: T | U,
  describeAsPOJO: (validator: T) => {}
): ValidatorHelperEntry<any> {
  return {
    validatorOrType: validatorOrType,
    describeAsPOJO: describeAsPOJO
  };
}

const validatorHelpers: Array<ValidatorHelperEntry<any>> = [
  makeValidatorHelper(Validators.undefinedValidator, () => ({
    type: "UndefinedValidator"
  })),
  makeValidatorHelper(Validators.nullValidator, () => ({
    type: "NullValidator"
  })),
  makeValidatorHelper(Validators.stringValidator, () => ({
    type: "StringValidator"
  })),
  makeValidatorHelper(Validators.numberValidator, () => ({
    type: "NumberValidator"
  })),
  makeValidatorHelper(Validators.booleanValidator, () => ({
    type: "BooleanValidator"
  })),
  makeValidatorHelper(
    Validators.OrValidator,
    (validator: Validators.OrValidator) => ({
      type: "OrValidator",
      validators: validator.validators.map(describeValidatorAsPOJO)
    })
  ),
  makeValidatorHelper(
    Validators.ObjectValidator,
    (validator: Validators.ObjectValidator<any>) => ({
      type: "ObjectValidator",
      properties: mapPOJO(validator.propertyValidators, v =>
        describeValidatorAsPOJO(v)
      )
    })
  )
];

function findHelperForValidator<T extends Validators.Validator<any>>(
  validator: T
): ValidatorHelperEntry<T> {
  const matches = validatorHelpers.filter(helper => {
    const validatorOrType = helper.validatorOrType;
    if (validatorOrType instanceof Validators.Validator) {
      return validatorOrType === validator;
    } else {
      return validator instanceof (helper.validatorOrType as any);
    }
  });
  if (matches.length === 0) {
    throw new Error("no helper found for validator");
  } else if (matches.length > 1) {
    throw new Error("multiple helpers found for validator");
  } else {
    return matches[0];
  }
}

export function describeValidatorAsPOJO(
  validator: Validators.Validator<any>
): {} {
  return findHelperForValidator(validator).describeAsPOJO(validator);
}
