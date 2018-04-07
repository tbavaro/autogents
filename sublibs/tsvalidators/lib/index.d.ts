export declare class ValidationError extends Error {
    readonly causes?: ValidationError[];
    constructor(msg: string, causes?: ValidationError[]);
}
export declare abstract class Validator {
    abstract validate(input: any): void;
    abstract describe(): {
        kind: string;
    };
    protected static describeHelper(kind: string, otherProperties?: {}): {
        kind: string;
    };
}
export declare class OrValidator extends Validator {
    readonly validators: ReadonlyArray<Validator>;
    constructor(validators: Validator[]);
    validate(input: any): void;
    describe(): {
        kind: string;
    };
}
export declare class ObjectValidator extends Validator {
    readonly propertyValidators: Readonly<{
        [propertyName: string]: Validator;
    }>;
    constructor(propertyValidators: {
        [propertyName: string]: Validator;
    });
    validate(input: any): void;
    describe(): {
        kind: string;
    };
}
export declare class TypeOfValidator extends Validator {
    readonly typeOfString: string;
    constructor(typeOfString: string);
    validate(input: any): void;
    describe(): {
        kind: string;
    };
}
export declare class ExactValueValidator extends Validator {
    readonly value: Readonly<any>;
    constructor(value: any);
    validate(input: any): void;
    describe(): {
        kind: string;
    };
}
export declare const undefinedValidator: Validator;
export declare const nullValidator: Validator;
export declare const stringValidator: Validator;
export declare const numberValidator: Validator;
export declare const booleanValidator: Validator;
export declare function createValidationFunction<T>(validator: Validator): (input: any) => T;
