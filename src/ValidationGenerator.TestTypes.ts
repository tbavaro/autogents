export type EmptyType = {};

export type NumberFieldTestObject = {
  aNumber: number;
};

export type StringFieldTestObject = {
  aString: string;
};

export type BooleanFieldTestObject = {
  aBoolean: boolean;
};

export type OptionalFieldTestObject = {
  anOptionalNumber?: number;
};

export type NullableFieldTestObject = {
  aNullableNumber: number | null;
};

export type BooleanLiteralFieldTestObject = {
  mustBeFalse: false;
  optionalTrue?: true;
};

export type SwitchedUnionFieldTestObject = (
  { isANumberNotAString: true, aNumber: number } |
  { isANumberNotAString: false, aString: string }
);

export type JustANumberAlias = number;

export type AnonymousNestedObjectTestObject = {
  anObject: {
    aNumber: number;
  };
}

export type SelfReferencingTestObject = {
  aNumber: number;
  anOptionalMe?: SelfReferencingTestObject;
}

export type CycleTestObject1 = {
  aNumber: number;
  anOptional2?: CycleTestObject2;
}

export type CycleTestObject2 = {
  aString: string;
  anOptional1?: CycleTestObject1;
}
