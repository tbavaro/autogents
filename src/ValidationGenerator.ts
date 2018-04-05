import * as ts from "typescript";
import * as TypescriptHelpers from "./TypescriptHelpers";
import * as Validators from "./Validators";
import { Validator } from "./Validators";

// these get replaced by stub references in the generated output
class StubValidator extends Validator {
  private privateDelegate?: Validator;

  public readonly key: string;

  set delegate(validator: Validator) {
    if (this.privateDelegate !== undefined && this.privateDelegate !== validator) {
      throw new Error("delegate can't be set twice");
    } else {
      this.privateDelegate = validator;
    }
  }

  get delegate(): Validator {
    if (this.privateDelegate === undefined) {
      throw new Error("delegate is not set");
    } else {
      return this.privateDelegate;
    }
  }

  constructor(key: string) {
    super();
    this.key = key;
  }

  public validate(input: any) {
    this.delegate.validate(input);
  }

  public describe() {
    return Validator.describeHelper("PassThroughValidator", {
      key: this.key,
      delegateIsSet: (this.privateDelegate !== undefined)
    });
  }
}

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

function getTypeAliasIfPossible(type: ts.Type): string | undefined {
  if (type.symbol && type.symbol.declarations) {
    if (type.symbol.declarations.length !== 1) {
      throw new Error(`don't know what to do with symbols with ${type.symbol.declarations.length} declarations`);
    }
    const declaration = type.symbol.declarations[0];
    const parent = declaration.parent;
    if (parent && ts.isTypeAliasDeclaration(parent)) {
      return getUniqueIdentifierForTypeDeclaredAtNode(parent);
      // return ts.idText(parent.name);
    }
    // console.log(
    //   "declaration",
    //   declaration.kind,
    //   declaration.parent.kind,
    //   ts.isTypeParameterDeclaration(declaration)
    // );
    // console.log("has symbol", type.symbol.declarations);
  }
  return undefined;
}

function getValidatorFor(
  declarationNode: ts.Node,
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  path: string,
  context: Context,
  isRoot?: boolean
): Validator {
  isRoot = !!isRoot;

  if (!isRoot) {
    const typeAliasOrUndefined = getTypeAliasIfPossible(type);
    if (typeAliasOrUndefined !== undefined) {
      return context.ptvFactory.getOrCreatePTV(typeAliasOrUndefined);
    }
  }

  // console.log("getting validator for", path);
  const reusableValidatorEntry = reusableValidators.find(entry =>
    entry.predicate(type)
  );
  if (reusableValidatorEntry) {
    return reusableValidatorEntry.validator;
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

function getUniqueIdentifierForTypeDeclaredAtNode(node: ts.Node): string {
  if (ts.isTypeAliasDeclaration(node)) {
    const name = ts.idText(node.name);
    // console.log("unique id", name);
    let fullName = name;
    let curNode: ts.Node | undefined = node;
    while (curNode.parent) {
      curNode = curNode.parent;
      if (ts.isSourceFile(curNode)) {
        fullName = curNode.fileName + ":" + fullName;
      } else {
        throw new Error("xcxc");
      }
      // console.log(curNode);
    }
    return fullName;
  } else {
    throw new Error("xcxc");
  }
}

function assertDefined<T>(value: T | undefined): T {
  if (value === undefined) {
    throw new Error("unexpected undefined");
  }
  return value;
}

function s(value: any): string {
  return JSON.stringify(value);
}

function addToLastLine(outputRows: string[], str: string) {
  outputRows[outputRows.length - 1] += str;
}

function removeFromLastLine(outputRows: string[], str: string) {
  if (outputRows[outputRows.length - 1].endsWith(str)) {
    outputRows[outputRows.length - 1] = outputRows[outputRows.length - 1].slice(0, outputRows[outputRows.length - 1].length - str.length);
  } else {
    throw new Error(`expected line to end with "${str}" but it didn't`);
  }
}

function pullNextThingOntoThisLine(outputRows: string[], func: () => void) {
  const rowIndex = outputRows.length - 1;
  const oldRow = outputRows[rowIndex];
  outputRows.splice(rowIndex, 1);
  func();
  outputRows[rowIndex] = oldRow + outputRows[rowIndex].trimLeft();
}

function serializeValidator(
  outputRows: string[],
  validator: Validator,
  uniqueIdToVariableNameMap: Map<string, string>,
  indent?: number) {
  const addComma = () => addToLastLine(outputRows, ",");
  const removeComma = () => removeFromLastLine(outputRows, ",");

  indent = indent || 0;
  const prefix = "  ".repeat(indent);
  const nextPrefix = prefix + "  ";

  if (validator === Validators.numberValidator) {
    outputRows.push(prefix + "Validators.numberValidator");
  } else if (validator === Validators.stringValidator) {
    outputRows.push(prefix + "Validators.stringValidator");
  } else if (validator === Validators.booleanValidator) {
    outputRows.push(prefix + "Validators.booleanValidator");
  } else if (validator === Validators.nullValidator) {
    outputRows.push(prefix + "Validators.nullValidator");
  } else if (validator === Validators.undefinedValidator) {
    outputRows.push(prefix + "Validators.undefinedValidator");
  } else if (validator instanceof Validators.ObjectValidator) {
    outputRows.push(prefix + "new ObjectValidator({");
    if (Object.keys(validator.propertyValidators).length > 0) {
      for (const [pName, pValidator] of Object.entries(validator.propertyValidators)) {
        outputRows.push(nextPrefix + `${s(pName)}: `);
        pullNextThingOntoThisLine(outputRows, () => {
          serializeValidator(outputRows, pValidator, uniqueIdToVariableNameMap, (indent || 0) + 1);
        });
        addComma();
      }
      removeComma();
    }
    outputRows.push(prefix + "})");
  } else if (validator instanceof Validators.OrValidator) {
    outputRows.push(prefix + "new OrValidator([");
    if (validator.validators.length > 0) {
      for (const subValidator of validator.validators) {
        serializeValidator(outputRows, subValidator, uniqueIdToVariableNameMap, indent + 1);
        addComma();
      }
      removeComma();
    }
    outputRows.push(prefix + "])");
  } else if (validator instanceof Validators.TypeOfValidator) {
    outputRows.push(prefix + `new TypeOfValidator(${s(validator.typeOfString)})`);
  } else if (validator instanceof Validators.ExactValueValidator) {
    outputRows.push(prefix + `new ExactValueValidator(${s(validator.value)})`);
  } else if (validator instanceof StubValidator) {
    const variableName = assertDefined(uniqueIdToVariableNameMap.get(validator.key));
    outputRows.push(prefix + `stubs.${variableName}`);
  } else {
    outputRows.push(prefix + "/* something else */");
  }
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

    const output: Map<string, () => Validator> = new Map();

    // xcxc maybe i don't need this and it can just be part of the closure below?
    const cache: Map<string, Validator> = new Map();

    const context: Context = {
      ptvFactory: this.ptvFactory
    };

    const symbolNamesToUniqueIdsMap = new Map<string, string>();
    this.idMap.set(sourceFileName, symbolNamesToUniqueIdsMap);

    TypescriptHelpers.findExports(sourceFile, this.program).forEach(stmt => {
      const type = this.typeChecker.getTypeAtLocation(stmt);
      let name: string;
      if (ts.isTypeAliasDeclaration(stmt)) {
        name = ts.idText(stmt.name);
      } else {
        throw new Error(
          "can't determine name of: " + TypescriptHelpers.describeNode(stmt)
        );
      }

      const uniqueId = getUniqueIdentifierForTypeDeclaredAtNode(stmt);
      symbolNamesToUniqueIdsMap.set(name, uniqueId);

      this.validatorMap.set(uniqueId, () => {
        const validator = getValidatorFor(stmt, type, this.typeChecker, name, context, /*isRoot=*/true);
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
      uniqueId => assertDefined(this.validatorMap.get(uniqueId))()
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
    return assertDefined(this.validatorMap.get(uniqueId))();
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

  public serializeValidators(): string {
    const uniqueIdToVariableNameMap = this.generateValidatorVariableNames();

    const lines: string[] = [];

    // declare the stubs first
    lines.push("/*** BEGIN stubs");
    lines.push("const stubs = {");
    for (const variableName of uniqueIdToVariableNameMap.values()) {
      lines.push(`  ${variableName}: Stub.createStub<Validator>(),`);
    }
    removeFromLastLine(lines, ",");
    lines.push("};");
    lines.push("/*** END stubs");
    lines.push("");

    for (const [sourceFileName, innerMap] of this.idMap.entries()) {
      lines.push(`/*** BEGIN "${sourceFileName}"`);

      for (const [symbolName, uniqueId] of innerMap) {
        const validator = assertDefined(this.validatorMap.get(uniqueId))();
        const variableName = assertDefined(uniqueIdToVariableNameMap.get(uniqueId));
        lines.push(`export const ${variableName} =`);
        lines.push("  Stub.assign(");
        lines.push(`    stubs.${variableName},`);
        serializeValidator(lines, validator, uniqueIdToVariableNameMap, 2);
        lines.push("  );");
      }

      lines.push(`/*** END "${sourceFileName}"`);
      lines.push("");
    }

    return lines.join("\n");
  }
}
