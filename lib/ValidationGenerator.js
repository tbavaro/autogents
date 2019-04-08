"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validators = require("tsvalidators");
const ts = require("typescript");
const TypescriptCodeStringBuilder_1 = require("./TypescriptCodeStringBuilder");
const TypescriptHelpers = require("./TypescriptHelpers");
const Utils = require("./Utils");
const ValidatorUtils_1 = require("./ValidatorUtils");
const ValidatorUtils = require("./ValidatorUtils");
class StubValidatorFactory {
    constructor() {
        this.unresolvedKeyToPTVMap = new Map();
    }
    getOrCreatePTV(key) {
        let validator = this.unresolvedKeyToPTVMap.get(key);
        if (validator === undefined) {
            validator = new ValidatorUtils_1.StubValidator(key);
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
function getTypeNameIfReference(type, typeChecker) {
    const typeNode = typeChecker.typeToTypeNode(type);
    if (typeNode !== undefined && ts.isTypeReferenceNode(typeNode)) {
        const typeName = typeNode.typeName;
        if (ts.isIdentifier(typeName)) {
            return ts.idText(typeName);
        }
        else {
            throw new Error(`unsupported typeName type: ${typeName.kind}`);
        }
    }
    else {
        return undefined;
    }
}
function getValidatorFor(declarationNode, type, typeChecker, path, context, isRoot, rootName) {
    const maybeReferencedTypeName = getTypeNameIfReference(type, typeChecker);
    if (maybeReferencedTypeName !== undefined && (!isRoot || maybeReferencedTypeName !== rootName)) {
        return context.ptvFactory.getOrCreatePTV(maybeReferencedTypeName);
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
    else if (TypescriptHelpers.flagsMatch(type.flags, ts.TypeFlags.StringOrNumberLiteral)) {
        const value = type.value;
        return new Validators.ExactValueValidator(value);
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
function serializeValidator(output, referencedUniqueIds, validator, uniqueIdToVariableNameMap) {
    const rawSerializedString = ValidatorUtils.instantiate(validator, "V");
    const fixedSerializedString = ValidatorUtils_1.StubValidator.swapAndRecordReferences(rawSerializedString, referencedUniqueIds, uniqueIdToVariableNameMap);
    return output.append(fixedSerializedString);
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
            const uniqueId = name;
            symbolNamesToUniqueIdsMap.set(name, uniqueId);
            this.validatorMap.set(uniqueId, () => {
                const validator = getValidatorFor(stmt, type, this.typeChecker, name, context, true, name);
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
    serializeValidators(optimize) {
        const uniqueIdToVariableNameMap = this.generateValidatorVariableNames();
        const variableNameToCodeSnippetMap = new Map();
        const allReferencedVariableNames = new Set();
        for (const innerMap of this.idMap.values()) {
            for (const uniqueId of innerMap.values()) {
                let validator = Utils.assertDefined(this.validatorMap.get(uniqueId))();
                if (optimize) {
                    validator = ValidatorUtils.optimize(validator);
                }
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
            'import * as V from "tsvalidators";'
        ]);
        if (stubbedVariableNames.size > 0) {
            output.appendSection("stubs", () => {
                output.append("const stubs = {");
                for (const variableName of stubbedVariableNames) {
                    output.append(`${variableName}: V.Stub.createStub<V.Validator>(),`);
                }
                output.append("};");
            });
        }
        output.appendSection("validators", () => {
            for (const [variableName, codeSnippet] of variableNameToCodeSnippetMap.entries()) {
                output.append(`export const ${variableName} =`);
                const stubbed = stubbedVariableNames.has(variableName);
                if (stubbed) {
                    output.append(`V.Stub.assign(stubs.${variableName},`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVmFsaWRhdGlvbkdlbmVyYXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9WYWxpZGF0aW9uR2VuZXJhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQTJDO0FBRTNDLGlDQUFpQztBQUNqQywrRUFBd0U7QUFDeEUseURBQXlEO0FBQ3pELGlDQUFpQztBQUNqQyxxREFBaUQ7QUFDakQsbURBQW1EO0FBRW5ELE1BQU0sb0JBQW9CO0lBQTFCO1FBQ1UsMEJBQXFCLEdBQStCLElBQUksR0FBRyxFQUFFLENBQUM7SUFxQnhFLENBQUM7SUFuQlEsY0FBYyxDQUFDLEdBQVc7UUFDL0IsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNwRCxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7WUFDM0IsU0FBUyxHQUFHLElBQUksOEJBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNuQyxJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQztTQUNoRDtRQUNELE9BQU8sU0FBUyxDQUFDO0lBQ25CLENBQUM7SUFFTSxPQUFPLENBQUMsaUJBQStDO1FBQzVELElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDOUMsTUFBTSxTQUFTLEdBQUcsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzdDLElBQUksQ0FBQyxTQUFTLEVBQUU7Z0JBQ2QsTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsR0FBRyxHQUFHLENBQUMsQ0FBQzthQUN2RDtZQUNELEdBQUcsQ0FBQyxRQUFRLEdBQUcsU0FBUyxFQUFFLENBQUM7UUFDN0IsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxFQUFFLENBQUM7SUFD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