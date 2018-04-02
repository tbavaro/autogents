import * as ts from "typescript";
import * as TypescriptHelpers from "./TypescriptHelpers";
import * as Validators from "./Validators";

function createObjectValidatorFor(
  declarationNode: ts.Node,
  properties: ts.Symbol[],
  typeChecker: ts.TypeChecker
): Validators.ObjectValidator<any> {
  const propertyValidators: {
    [propertyName: string]: Validators.Validator<any>;
  } = {};
  properties.forEach(property => {
    const propType = typeChecker.getTypeOfSymbolAtLocation(
      property,
      declarationNode
    );
    propertyValidators[property.name] = getValidatorFor(
      declarationNode,
      propType,
      typeChecker
    );
  });

  return new Validators.ObjectValidator(propertyValidators);
}

type ReusableValidatorEntry = {
  predicate: (type: ts.Type) => boolean;
  validator: Validators.Validator<any>;
};

const reusableValidators: ReusableValidatorEntry[] = [];

function addSimpleFlagBasedValidator(
  flag: ts.TypeFlags,
  validator: Validators.Validator<any>
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
  typeChecker: ts.TypeChecker
) {
  const validators = types.map(type =>
    getValidatorFor(declarationNode, type, typeChecker)
  );
  return new Validators.OrValidator(validators);
}

function getValidatorFor(
  declarationNode: ts.Node,
  type: ts.Type,
  typeChecker: ts.TypeChecker
): Validators.Validator<any> {
  const reusableValidatorEntry = reusableValidators.find(entry =>
    entry.predicate(type)
  );
  if (reusableValidatorEntry) {
    return reusableValidatorEntry.validator;
  } else if (TypescriptHelpers.typeIsObject(type)) {
    return createObjectValidatorFor(
      declarationNode,
      type.getProperties(),
      typeChecker
    );
  } else if (TypescriptHelpers.flagsMatch(type.flags, ts.TypeFlags.Union)) {
    const types = (type as ts.UnionOrIntersectionType).types;
    return getValidatorForUnion(declarationNode, types, typeChecker);
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

export default class ValidationGenerator {
  private readonly program: ts.Program;
  private readonly typeChecker: ts.TypeChecker;

  constructor(sourceFileNames: string[]) {
    const options: ts.CompilerOptions = {
      strictNullChecks: true
    };

    this.program = ts.createProgram(sourceFileNames, options);
    this.typeChecker = this.program.getTypeChecker();
  }

  public lazilyGenerateValidatorsFor(
    sourceFileName: string
  ): Map<string, () => Validators.Validator<any>> {
    const sourceFile = this.program.getSourceFile(sourceFileName);
    if (!sourceFile) {
      throw new Error(`no source file found with name: ${sourceFileName}`);
    }

    const output: Map<string, () => Validators.Validator<any>> = new Map();
    const cache: Map<string, Validators.Validator<any>> = new Map();

    TypescriptHelpers.findExports(sourceFile, this.program).forEach(stmt => {
      const type = this.typeChecker.getTypeAtLocation(stmt);
      let name: string;
      if (ts.isTypeAliasDeclaration(stmt)) {
        name = ts.idText(stmt.name);
      } else {
        // // TODO be more careful
        // const symbol = type.aliasSymbol || type.symbol;
        // if (symbol) {
        //   name = symbol.name;
        // } else {
          throw new Error(
            "can't determine name of: " + TypescriptHelpers.describeNode(stmt)
          );
        // }
      }

      output.set(name, () => {
        let cachedResult = cache.get(name);
        if (!cachedResult) {
          cachedResult = getValidatorFor(stmt, type, this.typeChecker);
          cache.set(name, cachedResult);
        }
        return cachedResult;
      });
    });

    return output;
  }

  public generateValidatorsFor(
    sourceFileName: string
  ): Map<string, Validators.Validator<any>> {
    return transformMapValues(
      this.lazilyGenerateValidatorsFor(sourceFileName),
      func => func()
    );
  }
}
