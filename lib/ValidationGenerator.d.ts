import { Validator } from "tsvalidators";
export declare class StubValidator extends Validator {
    private privateDelegate?;
    readonly key: string;
    delegate: Validator;
    constructor(key: string);
    validate(input: any): void;
    describe(): {
        kind: string;
    };
}
export default class ValidationGenerator {
    private readonly program;
    private readonly typeChecker;
    private readonly ptvFactory;
    private readonly idMap;
    private readonly validatorMap;
    constructor(sourceFileNames: string[]);
    private lazilyGenerateValidatorsFor(sourceFileName);
    generateValidatorsFor(sourceFileName: string): Map<string, Validator>;
    getValidator(sourceFileName: string, symbolName: string): Validator;
    private forEachUniqueId(func);
    private generateValidatorVariableNames();
    serializeValidators(): string;
}
