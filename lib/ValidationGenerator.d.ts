import { Validator } from "tsvalidators";
export default class ValidationGenerator {
    private readonly program;
    private readonly typeChecker;
    private readonly ptvFactory;
    private readonly idMap;
    private readonly validatorMap;
    constructor(sourceFileNames: string[]);
    private lazilyGenerateValidatorsFor;
    generateValidatorsFor(sourceFileName: string): Map<string, Validator>;
    getValidator(sourceFileName: string, symbolName: string): Validator;
    private forEachUniqueId;
    private generateValidatorVariableNames;
    serializeValidators(optimize?: boolean): string;
}
