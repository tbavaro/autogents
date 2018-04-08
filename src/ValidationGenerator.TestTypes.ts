/**
 * @autogents validator
 */
export type EmptyType = {};

/**
 * @autogents validator
 */
export type NumberFieldTestObject = {
  aNumber: number;
};

/**
 * @autogents validator
 */
export type StringFieldTestObject = {
  aString: string;
};

/**
 * @autogents validator
 */
export type BooleanFieldTestObject = {
  aBoolean: boolean;
};

/**
 * @autogents validator
 */
export type OptionalFieldTestObject = {
  anOptionalNumber?: number;
};

/**
 * @autogents validator
 */
export type NullableFieldTestObject = {
  aNullableNumber: number | null;
};

/**
 * @autogents validator
 */
export type BooleanLiteralFieldTestObject = {
  mustBeFalse: false;
  optionalTrue?: true;
};

/**
 * @autogents validator
 */
export type SwitchedUnionFieldTestObject = (
  { isANumberNotAString: true, aNumber: number } |
  { isANumberNotAString: false, aString: string }
);

/**
 * @autogents validator
 */
export type NumbersArrayTestObject = {
  numbers: number[];
};

/**
 * @autogents validator
 */
export type NumbersAndOrStringsArrayTestObject = {
  numbersAndOrStrings: Array<number | string>;
};

/**
 * @autogents validator
 */
export type JustANumberAlias = number;

/**
 * @autogents validator
 */
export type AnonymousNestedObjectTestObject = {
  anObject: {
    aNumber: number;
  };
}

/**
 * @autogents validator
 */
export type SelfReferencingTestObject = {
  aNumber: number;
  anOptionalMe?: SelfReferencingTestObject;
}

/**
 * @autogents validator
 */
export type CycleTestObject1 = {
  aNumber: number;
  anOptional2?: CycleTestObject2;
}

/**
 * @autogents validator
 */
export type CycleTestObject2 = {
  aString: string;
  anOptional1?: CycleTestObject1;
}

/**
 * @autogents validator
 */
export type NumberFieldTestObjectAlias = NumberFieldTestObject;
