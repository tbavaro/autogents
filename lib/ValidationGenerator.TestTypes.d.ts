export declare type EmptyType = {};
export declare type NumberFieldTestObject = {
    aNumber: number;
};
export declare type StringFieldTestObject = {
    aString: string;
};
export declare type BooleanFieldTestObject = {
    aBoolean: boolean;
};
export declare type OptionalFieldTestObject = {
    anOptionalNumber?: number;
};
export declare type NullableFieldTestObject = {
    aNullableNumber: number | null;
};
export declare type UsesNullableFieldTestObject = {
    anObject: NumberFieldTestObject;
};
export declare type BooleanLiteralFieldTestObject = {
    mustBeFalse: false;
    optionalTrue?: true;
};
export declare type SwitchedUnionFieldTestObject = ({
    isANumberNotAString: true;
    aNumber: number;
} | {
    isANumberNotAString: false;
    aString: string;
});
export declare type NumbersArrayTestObject = {
    numbers: number[];
};
export declare type NumbersAndOrStringsArrayTestObject = {
    numbersAndOrStrings: Array<number | string>;
};
export declare type JustANumberAlias = number;
export declare type AnonymousNestedObjectTestObject = {
    anObject: {
        aNumber: number;
    };
};
export declare type SelfReferencingTestObject = {
    aNumber: number;
    anOptionalMe?: SelfReferencingTestObject;
};
export declare type CycleTestObject1 = {
    aNumber: number;
    anOptional2?: CycleTestObject2;
};
export declare type CycleTestObject2 = {
    aString: string;
    anOptional1?: CycleTestObject1;
};
export declare type NumberFieldTestObjectAlias = NumberFieldTestObject;
export declare type NumberLiteralObject = 1;
export declare type StringLiteralObject = "foo";
export declare type MultipleStringLiteralObject = "foo" | "bar";
export declare type UsesMultipleStringLiteralObject = {
    anObject: MultipleStringLiteralObject;
};
export declare type UsesOptionalMultipleStringLiteralObject = {
    anObject?: MultipleStringLiteralObject;
};
