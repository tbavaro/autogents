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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVmFsaWRhdGlvbkdlbmVyYXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9WYWxpZGF0aW9uR2VuZXJhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaUNBQWlDO0FBQ2pDLCtFQUF3RTtBQUN4RSx5REFBeUQ7QUFDekQsaUNBQWlDO0FBQ2pDLDJDQUEyQztBQUMzQyw2Q0FBeUM7QUFHekMsbUJBQW9CLFNBQVEsc0JBQVM7SUFLbkMsSUFBSSxRQUFRLENBQUMsU0FBb0I7UUFDL0IsSUFBSSxJQUFJLENBQUMsZUFBZSxLQUFLLFNBQVMsSUFBSSxJQUFJLENBQUMsZUFBZSxLQUFLLFNBQVMsRUFBRTtZQUM1RSxNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7U0FDaEQ7YUFBTTtZQUNMLElBQUksQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFDO1NBQ2xDO0lBQ0gsQ0FBQztJQUVELElBQUksUUFBUTtRQUNWLElBQUksSUFBSSxDQUFDLGVBQWUsS0FBSyxTQUFTLEVBQUU7WUFDdEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1NBQ3hDO2FBQU07WUFDTCxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7U0FDN0I7SUFDSCxDQUFDO0lBRUQsWUFBWSxHQUFXO1FBQ3JCLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFDakIsQ0FBQztJQUVNLFFBQVEsQ0FBQyxLQUFVO1FBQ3hCLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFTSxRQUFRO1FBQ2IsT0FBTyxzQkFBUyxDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsRUFBRTtZQUN0RCxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUc7WUFDYixhQUFhLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxLQUFLLFNBQVMsQ0FBQztTQUNwRCxDQUFDLENB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