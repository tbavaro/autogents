import * as Validators from "tsvalidators";
import { Validator } from "tsvalidators";
export declare function forceInitialization(): void;
export declare function describe(validator: Validator): string;
export declare function instantiate(validator: Validator, moduleName: string): string;
export declare function validatorNames(): string[];
export declare class StubValidator implements Validator {
    private privateDelegate?;
    readonly key: string;
    delegate: Validator;
    constructor(key: string);
    validate(input: any, path: string): Validators.ValidationResult;
    describe(): string;
    createInstantiationCall(): string;
    static swapAndRecordReferences(str: string, referencedUniqueIds: Set<string>, uniqueIdToVariableNameMap: Map<string, string>): string;
}
export declare function optimize(validator: Validator): Validator;
