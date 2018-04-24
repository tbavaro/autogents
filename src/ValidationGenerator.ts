import * as Validators from "tsvalidators";
import { Validator } from "tsvalidators";
import * as ts from "typescript";
import TypescriptCodeStringBuilder from "./TypescriptCodeStringBuilder";
import * as TypescriptHelpers from "./TypescriptHelpers";
import * as Utils from "./Utils";
import { StubValidator } from "./ValidatorUtils";
import * as ValidatorUtils from "./ValidatorUtils";

class StubValidatorFactory {
  private unresolvedKeyToPTVMap: Map<string, StubValidator> = new Map();

  public getOrCreatePTV(key: string): StubValidator {
    let validator = this.unresolvedKeyToPTVMap.get(key);
    if (validator === undefined) {
      validator = new StubValidator(key);
      this.unresolvedKeyToPTVMap.set(key, validator);
    }
    return validator;
  }

  public resolve(keyToValidatorMap: Map<string, () => Validator>) {
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

type Context = {
  ptvFactory: StubValidatorFactory;
};

function createObjectValidatorFor(
  declarationNode: ts.Node,
  properties: ts.Symbol[],
  typeChecker: ts.TypeChecker,
  path: string,
  context: Context
): Validators.ObjectValidator {
  const propertyValidators: {
    [propertyName: string]: Validator;
  } = {};
  properties.forEach(property => {
    const propType = typeChecker.getTypeOfSymbolAtLocation(
      property,
      declarationNode
    );
    propertyValidators[property.name] = getValidatorFor(
      declarationNode,
      propType,
      typeChecker,
      path + "." + property.name,
      context
    );
  });

  return new Validators.ObjectValidator(propertyValidators);
}

type ReusableValidatorEntry = {
  predicate: (type: ts.Type) => boolean;
  validator: Validator;
};

const reusableValidators: ReusableValidatorEntry[] = [];

function addSimpleFlagBasedValidator(
  flag: ts.TypeFlags,
  validator: Validator
) {
  reusableValidators.push({
    predicate: type => TypescriptHelpers.flagsMatch(type.flags, flag),
    validator: validator
  });
}

// primitives
addSimpleFlagBasedValidator(
  ts.TypeFlags.Undefined,
  Validators.undefinedValidator
);
addSimpleFlagBasedValidator(ts.TypeFlags.Null, Validators.nullValidator);
addSimpleFlagBasedValidator(ts.TypeFlags.String, Validators.stringValidator);
addSimpleFlagBasedValidator(ts.TypeFlags.Number, Validators.numberValidator);
addSimpleFlagBasedValidator(ts.TypeFlags.Boolean, Validators.booleanValidator);

function getValidatorForUnion(
  declarationNode: ts.Node,
  types: ts.Type[],
  typeChecker: ts.TypeChecker,
  path: string,
  context: Context
) {
  const validators = types.map((type, index) =>
    getValidatorFor(declarationNode, type, typeChecker, `${path}|${index}`, context)
  );
  return new Validators.OrValidator(validators);
}

function getTypeNameIfReference(type: ts.Type, typeChecker: ts.TypeChecker): string | undefined {
  const typeNode = typeChecker.typeToTypeNode(type);
  if (ts.isTypeReferenceNode(typeNode)) {
    const typeName = typeNode.typeName;
    if (ts.isIdentifier(typeName)) {
      return ts.idText(typeName);
    } else {
      throw new Error(`unsupported typeName type: ${typeName.kind}`);
    }
  } else {
    return undefined;
  }
}

function getValidatorFor(
  declarationNode: ts.Node,
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  path: string,
  context: Context,
  isRoot?: boolean,
  rootName?: string
): Validator {
  const maybeReferencedTypeName = getTypeNameIfReference(type, typeChecker);
  if (maybeReferencedTypeName !== undefined && (!isRoot || maybeReferencedTypeName !== rootName)) {
    return context.ptvFactory.getOrCreatePTV(maybeReferencedTypeName);
  }

  const reusableValidatorEntry = reusableValidators.find(entry =>
    entry.predicate(type)
  );
  if (reusableValidatorEntry) {
    return reusableValidatorEntry.validator;
  } else if (TypescriptHelpers.typeIsArray(type)) {
    const elementType = TypescriptHelpers.getArrayElementType(type);
    const elementValidator = getValidatorFor(
      declarationNode,
      elementType,
      typeChecker,
      path + "[]",
      context
    );
    return new Validators.ArrayValidator(elementValidator);
  } else if (TypescriptHelpers.typeIsObject(type)) {
    return createObjectValidatorFor(
      declarationNode,
      type.getProperties(),
      typeChecker,
      path,
      context
    );
  } else if (TypescriptHelpers.flagsMatch(type.flags, ts.TypeFlags.Union)) {
    const types = (type as ts.UnionOrIntersectionType).types;
    return getValidatorForUnion(declarationNode, types, typeChecker, path, context);
  } else if (TypescriptHelpers.flagsMatch(type.flags, ts.TypeFlags.BooleanLiteral)) {
    const intrinsicName = (type as any).intrinsicName;
    if (intrinsicName === "true") {
      return new Validators.ExactValueValidator(true);
    } else if (intrinsicName === "false") {
      return new Validators.ExactValueValidator(false);
    }
    throw new Error("expected boolean literal but I got this: " + JSON.stringify(typeChecker.getWidenedType(type)));
  } else if (TypescriptHelpers.flagsMatch(type.flags, ts.TypeFlags.StringOrNumberLiteral)) {
    const value = (type as ts.LiteralType).value;
    return new Validators.ExactValueValidator(value);
  } else {
    const typeStr = typeChecker.typeToString(type);
    throw new Error(
      `unable to figure out validator for: ${typeStr} (${type.flags})`
    );
  }
}

function transformMapValues<K, V1, V2>(input: Map<K, V1>, transform: (v: V1) => V2): Map<K, V2> {
  const output = new Map<K, V2>();
  const entries = input.entries();
  while (true) {
    const entry = entries.next();
    if (entry.done) {
      break;
    } else {
      output.set(entry.value[0], transform(entry.value[1]));
    }
  }
  return output;
}

function serializeValidator(
  output: TypescriptCodeStringBuilder,
  referencedUniqueIds: Set<string>,
  validator: Validator,
  uniqueIdToVariableNameMap: Map<string, string>
): TypescriptCodeStringBuilder {
  const rawSerializedString = ValidatorUtils.instantiate(validator, "V");
  const fixedSerializedString =
    StubValidator.swapAndRecordReferences(
      rawSerializedString,
      referencedUniqueIds,
      uniqueIdToVariableNameMap
    );
  return output.append(fixedSerializedString);
}

export default class ValidationGenerator {
  private readonly program: ts.Program;
  private readonly typeChecker: ts.TypeChecker;
  private readonly ptvFactory: StubValidatorFactory;

  // sourceFileName -> symbolName -> unique id
  private readonly idMap: Map<string, Map<string, string>>;

  // unique id -> () -> Validator
  private readonly validatorMap: Map<string, () => Validator>;

  constructor(sourceFileNames: string[]) {
    const options: ts.CompilerOptions = {
      strictNullChecks: true
    };

    this.program = ts.createProgram(sourceFileNames, options);
    this.typeChecker = this.program.getTypeChecker();
    this.ptvFactory = new StubValidatorFactory();
    this.idMap = new Map();
    this.validatorMap = new Map();

    sourceFileNames.forEach(f => this.lazilyGenerateValidatorsFor(f));
  }

  private lazilyGenerateValidatorsFor(sourceFileName: string) {
    const sourceFile = this.program.getSourceFile(sourceFileName);
    if (!sourceFile) {
      throw new Error(`no source file found with name: ${sourceFileName}`);
    }

    const context: Context = {
      ptvFactory: this.ptvFactory
    };

    const symbolNamesToUniqueIdsMap = new Map<string, string>();
    this.idMap.set(sourceFileName, symbolNamesToUniqueIdsMap);

    const eligibleStatements =
      TypescriptHelpers.findExports(sourceFile).filter(stmt => {
        return TypescriptHelpers.hasAutogentsJSDocFlag(stmt, "validator");
      });
    eligibleStatements.forEach(stmt => {
      const type = this.typeChecker.getTypeAtLocation(stmt);
      let name: string;
      if (ts.isTypeAliasDeclaration(stmt)) {
        name = ts.idText(stmt.name);
      } else {
        throw new Error(
          "can't determine name of: " + TypescriptHelpers.describeNode(stmt)
        );
      }

      const uniqueId = name;
      symbolNamesToUniqueIdsMap.set(name, uniqueId);

      this.validatorMap.set(uniqueId, () => {
        const validator = getValidatorFor(stmt, type, this.typeChecker, name, context, /*isRoot=*/true, name);
        // subsequent calls should just return this one;
        // set it first so we don't infinite loop if there's a cycle
        this.validatorMap.set(uniqueId, () => validator);
        this.ptvFactory.resolve(this.validatorMap);
        return validator;
      });
    });
  }

  public generateValidatorsFor(
    sourceFileName: string
  ): Map<string, Validator> {
    const submap = this.idMap.get(sourceFileName);
    if (submap === undefined) {
      throw new Error("no entries for source file: " + sourceFileName);
    }
    return transformMapValues(
      submap,
      uniqueId => Utils.assertDefined(this.validatorMap.get(uniqueId))()
    );
  }

  public getValidator(sourceFileName: string, symbolName: string): Validator {
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

  private forEachUniqueId(func: (uniqueId: string, symbolName: string, sourceFileName: string) => void) {
    for (const [sourceFileName, innerMap] of this.idMap.entries()) {
      for (const [symbolName, uniqueId] of innerMap) {
        func(uniqueId, symbolName, sourceFileName);
      }
    }
  }

  // returns uniqueId => variable name
  private generateValidatorVariableNames(): Map<string, string> {
    const usedVariableNames = new Set<string>();
    const output = new Map<string, string>();

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

  public serializeValidators(optimize?: boolean): string {
    const uniqueIdToVariableNameMap = this.generateValidatorVariableNames();

    const variableNameToCodeSnippetMap = new Map<string, string>();
    const allReferencedVariableNames = new Set<string>();

    for (const innerMap of this.idMap.values()) {
      for (const uniqueId of innerMap.values()) {
        let validator = Utils.assertDefined(this.validatorMap.get(uniqueId))();
        if (optimize) {
          validator = ValidatorUtils.optimize(validator);
        }

        const variableName = Utils.assertDefined(uniqueIdToVariableNameMap.get(uniqueId));

        const variableOutput = new TypescriptCodeStringBuilder();
        const variableReferencedUniqueIds = new Set<string>();
        serializeValidator(
          variableOutput,
          variableReferencedUniqueIds,
          validator,
          uniqueIdToVariableNameMap
        );

        const variableReferencedVariableNames = Utils.transformSetValues(
          variableReferencedUniqueIds,
          id => Utils.assertDefined(uniqueIdToVariableNameMap.get(id))
        );

        variableNameToCodeSnippetMap.set(variableName, variableOutput.build());
        Utils.addAll(allReferencedVariableNames, variableReferencedVariableNames);
      }
    }

    // TODO if we do topo sort we can minimize stubbing
    const stubbedVariableNames = allReferencedVariableNames;

    const output = new TypescriptCodeStringBuilder();

    output.appendLines([
      "/* AUTO-GENERATED from autogents -- DO NOT EDIT! */",
      "",
      'import * as V from "tsvalidators";'
    ]);

    // declare the stubs first
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
