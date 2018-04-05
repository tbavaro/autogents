"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const TypescriptCodeStringBuilder_1 = require("./TypescriptCodeStringBuilder");
const TypescriptHelpers = require("./TypescriptHelpers");
const Utils = require("./Utils");
const Validators = require("./Validators");
const Validators_1 = require("./Validators");
class StubValidator extends Validators_1.Validator {
    set delegate(validator) {
        if (this.privateDelegate !== undefined && this.privateDelegate !== validator) {
            throw new Error("delegate can't be set twice");
        }
        else {
            this.privateDelegate = validator;
        }
    }
    get delegate() {
        if (this.privateDelegate === undefined) {
            throw new Error("delegate is not set");
        }
        else {
            return this.privateDelegate;
        }
    }
    constructor(key) {
        super();
        this.key = key;
    }
    validate(input) {
        this.delegate.validate(input);
    }
    describe() {
        return Validators_1.Validator.describeHelper("PassThroughValidator", {
            key: this.key,
            delegateIsSet: (this.privateDelegate !== undefined)
        });
    }
}
class StubValidatorFactory {
    constructor() {
        this.unresolvedKeyToPTVMap = new Map();
    }
    getOrCreatePTV(key) {
        let validator = this.unresolvedKeyToPTVMap.get(key);
        if (validator === undefined) {
            validator = new StubValidator(key);
            this.unresolvedKeyToPTVMap.set(key, validator);
        }
        return validator;
    }
    resolve(keyToValidatorMap) {
        this.unresolvedKeyToPTVMap.forEach((ptv, key) => {
            const validator = keyToValidatorMap.get(key);
            if (!validator) {
                throw new Error("no validator found for key: " + key);
            }
            ptv.delegate = validator();
        });
        this.unresolvedKeyToPTVMap.clear();
    }
}
function createObjectValidatorFor(declarationNode, properties, typeChecker, path, context) {
    const propertyValidators = {};
    properties.forEach(property => {
        const propType = typeChecker.getTypeOfSymbolAtLocation(property, declarationNode);
        propertyValidators[property.name] = getValidatorFor(declarationNode, propType, typeChecker, path + "." + property.name, context);
    });
    return new Validators.ObjectValidator(propertyValidators);
}
const reusableValidators = [];
function addSimpleFlagBasedValidator(flag, validator) {
    reusableValidators.push({
        predicate: type => TypescriptHelpers.flagsMatch(type.flags, flag),
        validator: validator
    });
}
addSimpleFlagBasedValidator(ts.TypeFlags.Undefined, Validators.undefinedValidator);
addSimpleFlagBasedValidator(ts.TypeFlags.Null, Validators.nullValidator);
addSimpleFlagBasedValidator(ts.TypeFlags.String, Validators.stringValidator);
addSimpleFlagBasedValidator(ts.TypeFlags.Number, Validators.numberValidator);
addSimpleFlagBasedValidator(ts.TypeFlags.Boolean, Validators.booleanValidator);
function getValidatorForUnion(declarationNode, types, typeChecker, path, context) {
    const validators = types.map((type, index) => getValidatorFor(declarationNode, type, typeChecker, `${path}|${index}`, context));
    return new Validators.OrValidator(validators);
}
function getTypeAliasIfPossible(type) {
    if (type.symbol && type.symbol.declarations) {
        if (type.symbol.declarations.length !== 1) {
            throw new Error(`don't know what to do with symbols with ${type.symbol.declarations.length} declarations`);
        }
        const declaration = type.symbol.declarations[0];
        const parent = declaration.parent;
        if (parent && ts.isTypeAliasDeclaration(parent)) {
            return getUniqueIdentifierForTypeDeclaredAtNode(parent);
        }
    }
    return undefined;
}
function getValidatorFor(declarationNode, type, typeChecker, path, context, isRoot) {
    isRoot = !!isRoot;
    if (!isRoot) {
        const typeAliasOrUndefined = getTypeAliasIfPossible(type);
        if (typeAliasOrUndefined !== undefined) {
            return context.ptvFactory.getOrCreatePTV(typeAliasOrUndefined);
        }
    }
    const reusableValidatorEntry = reusableValidators.find(entry => entry.predicate(type));
    if (reusableValidatorEntry) {
        return reusableValidatorEntry.validator;
    }
    else if (TypescriptHelpers.typeIsObject(type)) {
        return createObjectValidatorFor(declarationNode, type.getProperties(), typeChecker, path, context);
    }
    else if (TypescriptHelpers.flagsMatch(type.flags, ts.TypeFlags.Union)) {
        const types = type.types;
        return getValidatorForUnion(declarationNode, types, typeChecker, path, context);
    }
    else if (TypescriptHelpers.flagsMatch(type.flags, ts.TypeFlags.BooleanLiteral)) {
        const intrinsicName = type.intrinsicName;
        if (intrinsicName === "true") {
            return new Validators.ExactValueValidator(true);
        }
        else if (intrinsicName === "false") {
            return new Validators.ExactValueValidator(false);
        }
        throw new Error("expected boolean literal but I got this: " + JSON.stringify(typeChecker.getWidenedType(type)));
    }
    else {
        const typeStr = typeChecker.typeToString(type);
        throw new Error(`unable to figure out validator for: ${typeStr} (${type.flags})`);
    }
}
function transformMapValues(input, transform) {
    const output = new Map();
    const entries = input.entries();
    while (true) {
        const entry = entries.next();
        if (entry.done) {
            break;
        }
        else {
            output.set(entry.value[0], transform(entry.value[1]));
        }
    }
    return output;
}
function getUniqueIdentifierForTypeDeclaredAtNode(node) {
    if (ts.isTypeAliasDeclaration(node)) {
        const name = ts.idText(node.name);
        let fullName = name;
        let curNode = node;
        while (curNode.parent) {
            curNode = curNode.parent;
            if (ts.isSourceFile(curNode)) {
                fullName = curNode.fileName + ":" + fullName;
            }
            else {
                throw new Error("xcxc");
            }
        }
        return fullName;
    }
    else {
        throw new Error("xcxc");
    }
}
function assertDefined(value) {
    if (value === undefined) {
        throw new Error("unexpected undefined");
    }
    return value;
}
function s(value) {
    return JSON.stringify(value);
}
function addToLastLine(outputRows, str) {
    outputRows[outputRows.length - 1] += str;
}
function removeFromLastLine(outputRows, str) {
    if (outputRows[outputRows.length - 1].endsWith(str)) {
        outputRows[outputRows.length - 1] = outputRows[outputRows.length - 1].slice(0, outputRows[outputRows.length - 1].length - str.length);
    }
    else {
        throw new Error(`expected line to end with "${str}" but it didn't`);
    }
}
function pullNextThingOntoThisLine(outputRows, func) {
    const rowIndex = outputRows.length - 1;
    const oldRow = outputRows[rowIndex];
    outputRows.splice(rowIndex, 1);
    func();
    outputRows[rowIndex] = oldRow + outputRows[rowIndex].trimLeft();
}
function serializeValidator(output, referencedUniqueIds, validator, uniqueIdToVariableNameMap) {
    if (validator === Validators.numberValidator) {
        output.append("Validators.numberValidator");
    }
    else if (validator === Validators.stringValidator) {
        output.append("Validators.stringValidator");
    }
    else if (validator === Validators.booleanValidator) {
        output.append("Validators.booleanValidator");
    }
    else if (validator === Validators.nullValidator) {
        output.append("Validators.nullValidator");
    }
    else if (validator === Validators.undefinedValidator) {
        output.append("Validators.undefinedValidator");
    }
    else if (validator instanceof Validators.ObjectValidator) {
        output.append("new ObjectValidator({");
        for (const [pName, pValidator] of Object.entries(validator.propertyValidators)) {
            output.append(`${s(pName)}: `);
            serializeValidator(output, referencedUniqueIds, pValidator, uniqueIdToVariableNameMap);
            output.append(",");
        }
        output.append("})");
    }
    else if (validator instanceof Validators.OrValidator) {
        output.append("new OrValidator([");
        for (const subValidator of validator.validators) {
            serializeValidator(output, referencedUniqueIds, subValidator, uniqueIdToVariableNameMap);
            output.append(",");
        }
        output.append("])");
    }
    else if (validator instanceof Validators.TypeOfValidator) {
        output.append(`new TypeOfValidator(${s(validator.typeOfString)})`);
    }
    else if (validator instanceof Validators.ExactValueValidator) {
        output.append(`new ExactValueValidator(${s(validator.value)})`);
    }
    else if (validator instanceof StubValidator) {
        const uniqueId = validator.key;
        const variableName = assertDefined(uniqueIdToVariableNameMap.get(uniqueId));
        output.append(`stubs.${variableName}`);
        referencedUniqueIds.add(uniqueId);
    }
    else {
        throw new Error("unable to serialize validator: " + validator.describe().kind);
    }
    return output;
}
class ValidationGenerator {
    constructor(sourceFileNames) {
        const options = {
            strictNullChecks: true
        };
        this.program = ts.createProgram(sourceFileNames, options);
        this.typeChecker = this.program.getTypeChecker();
        this.ptvFactory = new StubValidatorFactory();
        this.idMap = new Map();
        this.validatorMap = new Map();
        sourceFileNames.forEach(f => this.lazilyGenerateValidatorsFor(f));
    }
    lazilyGenerateValidatorsFor(sourceFileName) {
        const sourceFile = this.program.getSourceFile(sourceFileName);
        if (!sourceFile) {
            throw new Error(`no source file found with name: ${sourceFileName}`);
        }
        const output = new Map();
        const cache = new Map();
        const context = {
            ptvFactory: this.ptvFactory
        };
        const symbolNamesToUniqueIdsMap = new Map();
        this.idMap.set(sourceFileName, symbolNamesToUniqueIdsMap);
        TypescriptHelpers.findExports(sourceFile, this.program).forEach(stmt => {
            const type = this.typeChecker.getTypeAtLocation(stmt);
            let name;
            if (ts.isTypeAliasDeclaration(stmt)) {
                name = ts.idText(stmt.name);
            }
            else {
                throw new Error("can't determine name of: " + TypescriptHelpers.describeNode(stmt));
            }
            const uniqueId = getUniqueIdentifierForTypeDeclaredAtNode(stmt);
            symbolNamesToUniqueIdsMap.set(name, uniqueId);
            this.validatorMap.set(uniqueId, () => {
                const validator = getValidatorFor(stmt, type, this.typeChecker, name, context, true);
                this.validatorMap.set(uniqueId, () => validator);
                this.ptvFactory.resolve(this.validatorMap);
                return validator;
            });
        });
    }
    generateValidatorsFor(sourceFileName) {
        const submap = this.idMap.get(sourceFileName);
        if (submap === undefined) {
            throw new Error("no entries for source file: " + sourceFileName);
        }
        return transformMapValues(submap, uniqueId => assertDefined(this.validatorMap.get(uniqueId))());
    }
    getValidator(sourceFileName, symbolName) {
        const submap = this.idMap.get(sourceFileName);
        if (submap === undefined) {
            throw new Error("no entries for source file: " + sourceFileName);
        }
        const uniqueId = submap.get(symbolName);
        if (uniqueId === undefined) {
            throw new Error(`source file "${sourceFileName}" has no symbol "${symbolName}"`);
        }
        return assertDefined(this.validatorMap.get(uniqueId))();
    }
    forEachUniqueId(func) {
        for (const [sourceFileName, innerMap] of this.idMap.entries()) {
            for (const [symbolName, uniqueId] of innerMap) {
                func(uniqueId, symbolName, sourceFileName);
            }
        }
    }
    generateValidatorVariableNames() {
        const usedVariableNames = new Set();
        const output = new Map();
        this.forEachUniqueId((uniqueId, symbolName) => {
            const variableName = "validatorFor" + symbolName;
            if (usedVariableNames.has(variableName)) {
                throw new Error("duplicate variable name: " + variableName);
            }
            usedVariableNames.add(variableName);
            output.set(uniqueId, variableName);
        });
        return output;
    }
    serializeValidators() {
        const uniqueIdToVariableNameMap = this.generateValidatorVariableNames();
        const variableNameToCodeSnippetMap = new Map();
        const allReferencedVariableNames = new Set();
        for (const [sourceFileName, innerMap] of this.idMap.entries()) {
            for (const [symbolName, uniqueId] of innerMap) {
                const validator = assertDefined(this.validatorMap.get(uniqueId))();
                const variableName = assertDefined(uniqueIdToVariableNameMap.get(uniqueId));
                const variableOutput = new TypescriptCodeStringBuilder_1.default();
                const variableReferencedUniqueIds = new Set();
                serializeValidator(variableOutput, variableReferencedUniqueIds, validator, uniqueIdToVariableNameMap);
                const variableReferencedVariableNames = Utils.transformSetValues(variableReferencedUniqueIds, id => assertDefined(uniqueIdToVariableNameMap.get(id)));
                variableNameToCodeSnippetMap.set(variableName, variableOutput.build());
                Utils.addAll(allReferencedVariableNames, variableReferencedVariableNames);
            }
        }
        const stubbedVariableNames = allReferencedVariableNames;
        const output = new TypescriptCodeStringBuilder_1.default();
        output.appendLines([
            "/* AUTO-GENERATED from autogents -- DO NOT EDIT! */",
            "",
            'import * as Validator from "Validators";'
        ]);
        if (stubbedVariableNames.size > 0) {
            output.appendSection("stubs", () => {
                output.append("const stubs = {");
                for (const variableName of stubbedVariableNames) {
                    output.append(`${variableName}: Stub.createStub<Validator>(),`);
                }
                output.append("};");
            });
        }
        output.appendSection("validators", () => {
            for (const [variableName, codeSnippet] of variableNameToCodeSnippetMap.entries()) {
                output.append(`export const ${variableName} =`);
                const stubbed = stubbedVariableNames.has(variableName);
                if (stubbed) {
                    output.append(`Stub.assign(stubs.${variableName},`);
                }
                output.append(codeSnippet);
                if (stubbed) {
                    output.append(")");
                }
                output.append(";");
                output.appendNewLine();
            }
        });
        return output.buildPretty();
    }
}
exports.default = ValidationGenerator;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVmFsaWRhdGlvbkdlbmVyYXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9WYWxpZGF0aW9uR2VuZXJhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaUNBQWlDO0FBQ2pDLCtFQUF3RTtBQUN4RSx5REFBeUQ7QUFDekQsaUNBQWlDO0FBQ2pDLDJDQUEyQztBQUMzQyw2Q0FBeUM7QUFHekMsbUJBQW9CLFNBQVEsc0JBQVM7SUFLbkMsSUFBSSxRQUFRLENBQUMsU0FBb0I7UUFDL0IsSUFBSSxJQUFJLENBQUMsZUFBZSxLQUFLLFNBQVMsSUFBSSxJQUFJLENBQUMsZUFBZSxLQUFLLFNBQVMsRUFBRTtZQUM1RSxNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7U0FDaEQ7YUFBTTtZQUNMLElBQUksQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFDO1NBQ2xDO0lBQ0gsQ0FBQztJQUVELElBQUksUUFBUTtRQUNWLElBQUksSUFBSSxDQUFDLGVBQWUsS0FBSyxTQUFTLEVBQUU7WUFDdEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1NBQ3hDO2FBQU07WUFDTCxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7U0FDN0I7SUFDSCxDQUFDO0lBRUQsWUFBWSxHQUFXO1FBQ3JCLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFDakIsQ0FBQztJQUVNLFFBQVEsQ0FBQyxLQUFVO1FBQ3hCLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFTSxRQUFRO1FBQ2IsT0FBTyxzQkFBUyxDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsRUFBRTtZQUN0RCxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUc7WUFDYixhQUFhLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxLQUFLLFNBQVMsQ0FBQztTQUNwRCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFFRDtJQUFBO1FBQ1UsMEJBQXFCLEdBQStCLElBQUksR0FBRyxFQUFFLENBQUM7SUFxQnhFLENBQUM7SUFuQlEsY0FBYyxDQUFDLEdBQVc7UUFDL0IsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNwRCxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7WUFDM0IsU0FBUyxHQUFHLElBQUksYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1NBQ2hEO1FBQ0QsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztJQUVNLE9BQU8sQ0FBQyxpQkFBK0M7UUFDNUQsSUFBSSxDQUFDLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUM5QyxNQUFNLFNBQVMsR0FBRyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDN0MsSUFBSSxDQUFDLFNBQVMsRUFBRTtnQkFDZCxNQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixHQUFHLEdBQUcsQ0FBQyxDQUFDO2FBQ3ZEO1lBQ0QsR0FBRyxDQUFDLFFBQVEsR0FBRyxTQUFTLEVBQUUsQ0FBQztRQUM3QixDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNyQyxDQUFDO0NBQ0Y7QUFNRCxrQ0FDRSxlQUF3QixFQUN4QixVQUF1QixFQUN2QixXQUEyQixFQUMzQixJQUFZLEVBQ1osT0FBZ0I7SUFFaEIsTUFBTSxrQkFBa0IsR0FFcEIsRUFBRSxDQUFDO0lBQ1AsVUFBVSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUM1QixNQUFNLFFBQVEsR0FBRyxXQUFXLENBQUMseUJBQXlCLENBQ3BELFFBQVEsRUFDUixlQUFlLENBQ2hCLENBQUM7UUFDRixrQkFBa0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsZUFBZSxDQUNqRCxlQUFlLEVBQ2YsUUFBUSxFQUNSLFdBQVcsRUFDWCxJQUFJLEdBQUcsR0FBRyxHQUFHLFFBQVEsQ0FBQyxJQUFJLEVBQzFCLE9BQU8sQ0FDUixDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLElBQUksVUFBVSxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFPRCxNQUFNLGtCQUFrQixHQUE2QixFQUFFLENBQUM7QUFFeEQscUNBQ0UsSUFBa0IsRUFDbEIsU0FBb0I7SUFFcEIsa0JBQWtCLENBQUMsSUFBSSxDQUFDO1FBQ3RCLFNBQVMsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQztRQUNqRSxTQUFTLEVBQUUsU0FBUztLQUNyQixDQUFDLENBQUM7QUFDTCxDQUFDO0FBR0QsMkJBQTJCLENBQ3pCLEVBQUUsQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUN0QixVQUFVLENBQUMsa0JBQWtCLENBQzlCLENBQUM7QUFDRiwyQkFBMkIsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDekUsMkJBQTJCLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBQzdFLDJCQUEyQixDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUM3RSwyQkFBMkIsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUUvRSw4QkFDRSxlQUF3QixFQUN4QixLQUFnQixFQUNoQixXQUEyQixFQUMzQixJQUFZLEVBQ1osT0FBZ0I7SUFFaEIsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUMzQyxlQUFlLENBQUMsZUFBZSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsR0FBRyxJQUFJLElBQUksS0FBSyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQ2pGLENBQUM7SUFDRixPQUFPLElBQUksVUFBVSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNoRCxDQUFDO0FBRUQsZ0NBQWdDLElBQWE7SUFDM0MsSUFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFO1FBQzNDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUN6QyxNQUFNLElBQUksS0FBSyxDQUFDLDJDQUEyQyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLGVBQWUsQ0FBQyxDQUFDO1NBQzVHO1FBQ0QsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEQsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQztRQUNsQyxJQUFJLE1BQU0sSUFBSSxFQUFFLENBQUMsc0JBQXNCLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDL0MsT0FBTyx3Q0FBd0MsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUV6RDtLQVFGO0lBQ0QsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQztBQUVELHlCQUNFLGVBQXdCLEVBQ3hCLElBQWEsRUFDYixXQUEyQixFQUMzQixJQUFZLEVBQ1osT0FBZ0IsRUFDaEIsTUFBZ0I7SUFFaEIsTUFBTSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7SUFFbEIsSUFBSSxDQUFDLE1BQU0sRUFBRTtRQUNYLE1BQU0sb0JBQW9CLEdBQUcsc0JBQXNCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUQsSUFBSSxvQkFBb0IsS0FBSyxTQUFTLEVBQUU7WUFDdEMsT0FBTyxPQUFPLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1NBQ2hFO0tBQ0Y7SUFHRCxNQUFNLHNCQUFzQixHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUM3RCxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUN0QixDQUFDO0lBQ0YsSUFBSSxzQkFBc0IsRUFBRTtRQUMxQixPQUFPLHNCQUFzQixDQUFDLFNBQVMsQ0FBQztLQUN6QztTQUFNLElBQUksaUJBQWlCLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQy9DLE9BQU8sd0JBQXdCLENBQzdCLGVBQWUsRUFDZixJQUFJLENBQUMsYUFBYSxFQUFFLEVBQ3BCLFdBQVcsRUFDWCxJQUFJLEVBQ0osT0FBTyxDQUNSLENBQUM7S0FDSDtTQUFNLElBQUksaUJBQWlCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUN2RSxNQUFNLEtBQUssR0FBSSxJQUFtQyxDQUFDLEtBQUssQ0FBQztRQUN6RCxPQUFPLG9CQUFvQixDQUFDLGVBQWUsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztLQUNqRjtTQUFNLElBQUksaUJBQWlCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsRUFBRTtRQUNoRixNQUFNLGFBQWEsR0FBSSxJQUFZLENBQUMsYUFBYSxDQUFDO1FBQ2xELElBQUksYUFBYSxLQUFLLE1BQU0sRUFBRTtZQUM1QixPQUFPLElBQUksVUFBVSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2pEO2FBQU0sSUFBSSxhQUFhLEtBQUssT0FBTyxFQUFFO1lBQ3BDLE9BQU8sSUFBSSxVQUFVLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDbEQ7UUFDRCxNQUFNLElBQUksS0FBSyxDQUFDLDJDQUEyQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDakg7U0FBTTtRQUNMLE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0MsTUFBTSxJQUFJLEtBQUssQ0FDYix1Q0FBdUMsT0FBTyxLQUFLLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FDakUsQ0FBQztLQUNIO0FBQ0gsQ0FBQztBQUVELDRCQUF1QyxLQUFpQixFQUFFLFNBQXdCO0lBQ2hGLE1BQU0sTUFBTSxHQUFHLElBQUksR0FBRyxFQUFTLENBQUM7SUFDaEMsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ2hDLE9BQU8sSUFBSSxFQUFFO1FBQ1gsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzdCLElBQUksS0FBSyxDQUFDLElBQUksRUFBRTtZQUNkLE1BQU07U0FDUDthQUFNO1lBQ0wsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN2RDtLQUNGO0lBQ0QsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQUVELGtEQUFrRCxJQUFhO0lBQzdELElBQUksRUFBRSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ25DLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWxDLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQztRQUNwQixJQUFJLE9BQU8sR0FBd0IsSUFBSSxDQUFDO1FBQ3hDLE9BQU8sT0FBTyxDQUFDLE1BQU0sRUFBRTtZQUNyQixPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUN6QixJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQzVCLFFBQVEsR0FBRyxPQUFPLENBQUMsUUFBUSxHQUFHLEdBQUcsR0FBRyxRQUFRLENBQUM7YUFDOUM7aUJBQU07Z0JBQ0wsTUFBTSxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUN6QjtTQUVGO1FBQ0QsT0FBTyxRQUFRLENBQUM7S0FDakI7U0FBTTtRQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDekI7QUFDSCxDQUFDO0FBRUQsdUJBQTBCLEtBQW9CO0lBQzVDLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtRQUN2QixNQUFNLElBQUksS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUM7S0FDekM7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRCxXQUFXLEtBQVU7SUFDbkIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQy9CLENBQUM7QUFFRCx1QkFBdUIsVUFBb0IsRUFBRSxHQUFXO0lBQ3RELFVBQVUsQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQztBQUMzQyxDQUFDO0FBRUQsNEJBQTRCLFVBQW9CLEVBQUUsR0FBVztJQUMzRCxJQUFJLFVBQVUsQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNuRCxVQUFVLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDdkk7U0FBTTtRQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsOEJBQThCLEdBQUcsaUJBQWlCLENBQUMsQ0FBQztLQUNyRTtBQUNILENBQUM7QUFFRCxtQ0FBbUMsVUFBb0IsRUFBRSxJQUFnQjtJQUN2RSxNQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUN2QyxNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDcEMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDL0IsSUFBSSxFQUFFLENBQUM7SUFDUCxVQUFVLENBQUMsUUFBUSxDQUFDLEdBQUcsTUFBTSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNsRSxDQUFDO0FBRUQsNEJBQ0UsTUFBbUMsRUFDbkMsbUJBQWdDLEVBQ2hDLFNBQW9CLEVBQ3BCLHlCQUE4QztJQUU5QyxJQUFJLFNBQVMsS0FBSyxVQUFVLENBQUMsZUFBZSxFQUFFO1FBQzVDLE1BQU0sQ0FBQyxNQUFNLENBQUMsNEJBQTRCLENBQUMsQ0FBQztLQUM3QztTQUFNLElBQUksU0FBUyxLQUFLLFVBQVUsQ0FBQyxlQUFlLEVBQUU7UUFDbkQsTUFBTSxDQUFDLE1BQU0sQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0tBQzdDO1NBQU0sSUFBSSxTQUFTLEtBQUssVUFBVSxDQUFDLGdCQUFnQixFQUFFO1FBQ3BELE1BQU0sQ0FBQyxNQUFNLENBQUMsNkJBQTZCLENBQUMsQ0FBQztLQUM5QztTQUFNLElBQUksU0FBUyxLQUFLLFVBQVUsQ0FBQyxhQUFhLEVBQUU7UUFDakQsTUFBTSxDQUFDLE1BQU0sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0tBQzNDO1NBQU0sSUFBSSxTQUFTLEtBQUssVUFBVSxDQUFDLGtCQUFrQixFQUFFO1FBQ3RELE1BQU0sQ0FBQyxNQUFNLENBQUMsK0JBQStCLENBQUMsQ0FBQztLQUNoRDtTQUFNLElBQUksU0FBUyxZQUFZLFVBQVUsQ0FBQyxlQUFlLEVBQUU7UUFDMUQsTUFBTSxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1FBQ3ZDLEtBQUssTUFBTSxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFO1lBQzlFLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQy9CLGtCQUFrQixDQUNoQixNQUFNLEVBQ04sbUJBQW1CLEVBQ25CLFVBQVUsRUFDVix5QkFBeUIsQ0FDMUIsQ0FBQztZQUNGLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDcEI7UUFDRCxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3JCO1NBQU0sSUFBSSxTQUFTLFlBQVksVUFBVSxDQUFDLFdBQVcsRUFBRTtRQUN0RCxNQUFNLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDbkMsS0FBSyxNQUFNLFlBQVksSUFBSSxTQUFTLENBQUMsVUFBVSxFQUFFO1lBQy9DLGtCQUFrQixDQUNoQixNQUFNLEVBQ04sbUJBQW1CLEVBQ25CLFlBQVksRUFDWix5QkFBeUIsQ0FDMUIsQ0FBQztZQUNGLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDcEI7UUFDRCxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3JCO1NBQU0sSUFBSSxTQUFTLFlBQVksVUFBVSxDQUFDLGVBQWUsRUFBRTtRQUMxRCxNQUFNLENBQUMsTUFBTSxDQUFDLHVCQUF1QixDQUFDLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNwRTtTQUFNLElBQUksU0FBUyxZQUFZLFVBQVUsQ0FBQyxtQkFBbUIsRUFBRTtRQUM5RCxNQUFNLENBQUMsTUFBTSxDQUFDLDJCQUEyQixDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqRTtTQUFNLElBQUksU0FBUyxZQUFZLGFBQWEsRUFBRTtRQUM3QyxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDO1FBQy9CLE1BQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUM1RSxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUN2QyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDbkM7U0FBTTtRQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDLEdBQUcsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ2hGO0lBRUQsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQUVEO0lBV0UsWUFBWSxlQUF5QjtRQUNuQyxNQUFNLE9BQU8sR0FBdUI7WUFDbEMsZ0JBQWdCLEVBQUUsSUFBSTtTQUN2QixDQUFDO1FBRUYsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMxRCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDakQsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLG9CQUFvQixFQUFFLENBQUM7UUFDN0MsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUU5QixlQUFlLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEUsQ0FBQztJQUVPLDJCQUEyQixDQUFDLGNBQXNCO1FBQ3hELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQzlELElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDZixNQUFNLElBQUksS0FBSyxDQUFDLG1DQUFtQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO1NBQ3RFO1FBRUQsTUFBTSxNQUFNLEdBQWlDLElBQUksR0FBRyxFQUFFLENBQUM7UUFHdkQsTUFBTSxLQUFLLEdBQTJCLElBQUksR0FBRyxFQUFFLENBQUM7UUFFaEQsTUFBTSxPQUFPLEdBQVk7WUFDdkIsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVO1NBQzVCLENBQUM7UUFFRixNQUFNLHlCQUF5QixHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO1FBQzVELElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO1FBRTFELGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNyRSxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3RELElBQUksSUFBWSxDQUFDO1lBQ2pCLElBQUksRUFBRSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNuQyxJQUFJLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDN0I7aUJBQU07Z0JBQ0wsTUFBTSxJQUFJLEtBQUssQ0FDYiwyQkFBMkIsR0FBRyxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQ25FLENBQUM7YUFDSDtZQUVELE1BQU0sUUFBUSxHQUFHLHdDQUF3QyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2hFLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFOUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRTtnQkFDbkMsTUFBTSxTQUFTLEdBQUcsZUFBZSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFhLElBQUksQ0FBQyxDQUFDO2dCQUdoRyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ2pELElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDM0MsT0FBTyxTQUFTLENBQUM7WUFDbkIsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFTSxxQkFBcUIsQ0FDMUIsY0FBc0I7UUFFdEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDOUMsSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFO1lBQ3hCLE1BQU0sSUFBSSxLQUFLLENBQUMsOEJBQThCLEdBQUcsY0FBYyxDQUFDLENBQUM7U0FDbEU7UUFDRCxPQUFPLGtCQUFrQixDQUN2QixNQUFNLEVBQ04sUUFBUSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUM3RCxDQUFDO0lBQ0osQ0FBQztJQUVNLFlBQVksQ0FBQyxjQUFzQixFQUFFLFVBQWtCO1FBQzVELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQzlDLElBQUksTUFBTSxLQUFLLFNBQVMsRUFBRTtZQUN4QixNQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixHQUFHLGNBQWMsQ0FBQyxDQUFDO1NBQ2xFO1FBQ0QsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN4QyxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7WUFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsY0FBYyxvQkFBb0IsVUFBVSxHQUFHLENBQUMsQ0FBQztTQUNsRjtRQUNELE9BQU8sYUFBYSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUMxRCxDQUFDO0lBRU8sZUFBZSxDQUFDLElBQTRFO1FBQ2xHLEtBQUssTUFBTSxDQUFDLGNBQWMsRUFBRSxRQUFRLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxFQUFFO1lBQzdELEtBQUssTUFBTSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsSUFBSSxRQUFRLEVBQUU7Z0JBQzdDLElBQUksQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLGNBQWMsQ0FBQyxDQUFDO2FBQzVDO1NBQ0Y7SUFDSCxDQUFDO0lBR08sOEJBQThCO1FBQ3BDLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUM1QyxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztRQUV6QyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxFQUFFO1lBQzVDLE1BQU0sWUFBWSxHQUFHLGNBQWMsR0FBRyxVQUFVLENBQUM7WUFDakQsSUFBSSxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLEVBQUU7Z0JBQ3ZDLE1BQU0sSUFBSSxLQUFLLENBQUMsMkJBQTJCLEdBQUcsWUFBWSxDQUFDLENBQUM7YUFDN0Q7WUFDRCxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDcEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDckMsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRU0sbUJBQW1CO1FBQ3hCLE1BQU0seUJBQXlCLEdBQUcsSUFBSSxDQUFDLDhCQUE4QixFQUFFLENBQUM7UUFFeEUsTUFBTSw0QkFBNEIsR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztRQUMvRCxNQUFNLDBCQUEwQixHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7UUFFckQsS0FBSyxNQUFNLENBQUMsY0FBYyxFQUFFLFFBQVEsQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLEVBQUU7WUFDN0QsS0FBSyxNQUFNLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxJQUFJLFFBQVEsRUFBRTtnQkFDN0MsTUFBTSxTQUFTLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDbkUsTUFBTSxZQUFZLEdBQUcsYUFBYSxDQUFDLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUU1RSxNQUFNLGNBQWMsR0FBRyxJQUFJLHFDQUEyQixFQUFFLENBQUM7Z0JBQ3pELE1BQU0sMkJBQTJCLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztnQkFDdEQsa0JBQWtCLENBQ2hCLGNBQWMsRUFDZCwyQkFBMkIsRUFDM0IsU0FBUyxFQUNULHlCQUF5QixDQUMxQixDQUFDO2dCQUVGLE1BQU0sK0JBQStCLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixDQUM5RCwyQkFBMkIsRUFDM0IsRUFBRSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMseUJBQXlCLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQ3ZELENBQUM7Z0JBRUYsNEJBQTRCLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDdkUsS0FBSyxDQUFDLE1BQU0sQ0FBQywwQkFBMEIsRUFBRSwrQkFBK0IsQ0FBQyxDQUFDO2FBQzNFO1NBQ0Y7UUFHRCxNQUFNLG9CQUFvQixHQUFHLDBCQUEwQixDQUFDO1FBRXhELE1BQU0sTUFBTSxHQUFHLElBQUkscUNBQTJCLEVBQUUsQ0FBQztRQUVqRCxNQUFNLENBQUMsV0FBVyxDQUFDO1lBQ2pCLHFEQUFxRDtZQUNyRCxFQUFFO1lBQ0YsMENBQTBDO1NBQzNDLENBQUMsQ0FBQztRQUdILElBQUksb0JBQW9CLENBQUMsSUFBSSxHQUFHLENBQUMsRUFBRTtZQUNqQyxNQUFNLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7Z0JBQ2pDLE1BQU0sQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztnQkFDakMsS0FBSyxNQUFNLFlBQVksSUFBSSxvQkFBb0IsRUFBRTtvQkFDL0MsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLFlBQVksaUNBQWlDLENBQUMsQ0FBQztpQkFDakU7Z0JBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN0QixDQUFDLENBQUMsQ0FBQztTQUNKO1FBRUQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBQ3RDLEtBQUssTUFBTSxDQUFDLFlBQVksRUFBRSxXQUFXLENBQUMsSUFBSSw0QkFBNEIsQ0FBQyxPQUFPLEVBQUUsRUFBRTtnQkFDaEYsTUFBTSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsWUFBWSxJQUFJLENBQUMsQ0FBQztnQkFDaEQsTUFBTSxPQUFPLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUN2RCxJQUFJLE9BQU8sRUFBRTtvQkFDWCxNQUFNLENBQUMsTUFBTSxDQUFDLHFCQUFxQixZQUFZLEdBQUcsQ0FBQyxDQUFDO2lCQUNyRDtnQkFDRCxNQUFNLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUMzQixJQUFJLE9BQU8sRUFBRTtvQkFDWCxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2lCQUNwQjtnQkFDRCxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNuQixNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7YUFDeEI7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQzlCLENBQUM7Q0FDRjtBQTNMRCxzQ0EyTEMifQ==