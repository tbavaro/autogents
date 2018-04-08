"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validators = require("tsvalidators");
const tsvalidators_1 = require("tsvalidators");
const ts = require("typescript");
const TypescriptCodeStringBuilder_1 = require("./TypescriptCodeStringBuilder");
const TypescriptHelpers = require("./TypescriptHelpers");
const Utils = require("./Utils");
class StubValidator extends tsvalidators_1.Validator {
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
        return tsvalidators_1.Validator.describeHelper("PassThroughValidator", {
            key: this.key,
            delegateIsSet: (this.privateDelegate !== undefined)
        });
    }
}
exports.StubValidator = StubValidator;
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
function getTypeDeclarationIfPossible(type) {
    if (!type.symbol || !type.symbol.declarations) {
        return undefined;
    }
    if (type.symbol.declarations.length !== 1) {
        throw new Error(`don't know what to do with symbols with ` +
            `${type.symbol.declarations.length} declarations: ${type.symbol.name} ${type.flags}`);
    }
    const declaration = type.symbol.declarations[0];
    return declaration.parent;
}
function getTypeAliasIfPossible(type) {
    if (!TypescriptHelpers.typeIsArray(type) && type.symbol && type.symbol.declarations) {
        const parent = getTypeDeclarationIfPossible(type);
        if (parent && ts.isTypeAliasDeclaration(parent)) {
            return getUniqueIdentifierForTypeDeclaredAtNode(parent);
        }
    }
    return undefined;
}
function getValidatorFor(declarationNode, type, typeChecker, path, context, isRoot) {
    const typeAliasOrUndefined = getTypeAliasIfPossible(type);
    if (typeAliasOrUndefined !== undefined &&
        (!isRoot || getTypeDeclarationIfPossible(type) !== declarationNode)) {
        return context.ptvFactory.getOrCreatePTV(typeAliasOrUndefined);
    }
    const reusableValidatorEntry = reusableValidators.find(entry => entry.predicate(type));
    if (reusableValidatorEntry) {
        return reusableValidatorEntry.validator;
    }
    else if (TypescriptHelpers.typeIsArray(type)) {
        const elementType = TypescriptHelpers.getArrayElementType(type);
        const elementValidator = getValidatorFor(declarationNode, elementType, typeChecker, path + "[]", context);
        return new Validators.ArrayValidator(elementValidator);
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
function s(value) {
    return JSON.stringify(value);
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
    else if (validator instanceof Validators.ArrayValidator) {
        output.append("new ArrayValidator(");
        serializeValidator(output, referencedUniqueIds, validator.elementValidator, uniqueIdToVariableNameMap);
        output.append(")");
    }
    else if (validator instanceof Validators.TypeOfValidator) {
        output.append(`new TypeOfValidator(${s(validator.typeOfString)})`);
    }
    else if (validator instanceof Validators.ExactValueValidator) {
        output.append(`new ExactValueValidator(${s(validator.value)})`);
    }
    else if (validator instanceof StubValidator) {
        const uniqueId = validator.key;
        const variableName = Utils.assertDefined(uniqueIdToVariableNameMap.get(uniqueId));
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
        const context = {
            ptvFactory: this.ptvFactory
        };
        const symbolNamesToUniqueIdsMap = new Map();
        this.idMap.set(sourceFileName, symbolNamesToUniqueIdsMap);
        const eligibleStatements = TypescriptHelpers.findExports(sourceFile).filter(stmt => {
            return TypescriptHelpers.hasAutogentsJSDocFlag(stmt, "validator");
        });
        eligibleStatements.forEach(stmt => {
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
        return transformMapValues(submap, uniqueId => Utils.assertDefined(this.validatorMap.get(uniqueId))());
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
        return Utils.assertDefined(this.validatorMap.get(uniqueId))();
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
        for (const innerMap of this.idMap.values()) {
            for (const uniqueId of innerMap.values()) {
                const validator = Utils.assertDefined(this.validatorMap.get(uniqueId))();
                const variableName = Utils.assertDefined(uniqueIdToVariableNameMap.get(uniqueId));
                const variableOutput = new TypescriptCodeStringBuilder_1.default();
                const variableReferencedUniqueIds = new Set();
                serializeValidator(variableOutput, variableReferencedUniqueIds, validator, uniqueIdToVariableNameMap);
                const variableReferencedVariableNames = Utils.transformSetValues(variableReferencedUniqueIds, id => Utils.assertDefined(uniqueIdToVariableNameMap.get(id)));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVmFsaWRhdGlvbkdlbmVyYXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9WYWxpZGF0aW9uR2VuZXJhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQTJDO0FBQzNDLCtDQUF5QztBQUN6QyxpQ0FBaUM7QUFDakMsK0VBQXdFO0FBQ3hFLHlEQUF5RDtBQUN6RCxpQ0FBaUM7QUFHakMsbUJBQTJCLFNBQVEsd0JBQVM7SUFLMUMsSUFBSSxRQUFRLENBQUMsU0FBb0I7UUFDL0IsSUFBSSxJQUFJLENBQUMsZUFBZSxLQUFLLFNBQVMsSUFBSSxJQUFJLENBQUMsZUFBZSxLQUFLLFNBQVMsRUFBRTtZQUM1RSxNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7U0FDaEQ7YUFBTTtZQUNMLElBQUksQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFDO1NBQ2xDO0lBQ0gsQ0FBQztJQUVELElBQUksUUFBUTtRQUNWLElBQUksSUFBSSxDQUFDLGVBQWUsS0FBSyxTQUFTLEVBQUU7WUFDdEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1NBQ3hDO2FBQU07WUFDTCxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7U0FDN0I7SUFDSCxDQUFDO0lBRUQsWUFBWSxHQUFXO1FBQ3JCLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFDakIsQ0FBQztJQUVNLFFBQVEsQ0FBQyxLQUFVO1FBQ3hCLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFTSxRQUFRO1FBQ2IsT0FBTyx3QkFBUyxDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsRUFBRTtZQUN0RCxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUc7WUFDYixhQUFhLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxLQUFLLFNBQVMsQ0FBQztTQUNwRCxDQUFDLENB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