import * as ts from "typescript";
import * as TypescriptHelpers from "./TypescriptHelpers";
import * as Validators from "./Validators";

function createObjectValidatorFor(
  declarationNode: ts.Node,
  properties: ts.Symbol[],
  typeChecker: ts.TypeChecker
): Validators.ObjectValidator {
  const propertyValidators: {
    [propertyName: string]: Validators.Validator;
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
  validator: Validators.Validator;
};

const reusableValidators: ReusableValidatorEntry[] = [];

function addSimpleFlagBasedValidator(
  flag: ts.TypeFlags,
  validator: Validators.Validator
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
): Validators.Validator {
  if (TypescriptHelpers.typeIsObject(type)) {
    return createObjectValidatorFor(
      declarationNode,
      type.getProperties(),
      typeChecker
    );
  } else if (TypescriptHelpers.flagsMatch(type.flags, ts.TypeFlags.Union)) {
    const types = (type as ts.UnionOrIntersectionType).types;
    return getValidatorForUnion(declarationNode, types, typeChecker);
  } else {
    const reusableValidatorEntry = reusableValidators.find(entry =>
      entry.predicate(type)
    );
    if (reusableValidatorEntry) {
      return reusableValidatorEntry.validator;
    } else {
      const typeStr = typeChecker.typeToString(type);
      throw new Error(
        `unable to figure out validator for: ${typeStr} (${type.flags})`
      );
    }
  }
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

  public generateValidatorsFor(
    sourceFileName: string
  ): {
    [symbol: string]: Validators.Validator;
  } {
    const sourceFile = this.program.getSourceFile(sourceFileName);
    if (!sourceFile) {
      throw new Error(`no source file found with name: ${sourceFileName}`);
    }

    const output: {
      [symbol: string]: Validators.Validator;
    } = {};

    TypescriptHelpers.findExports(sourceFile, this.program).forEach(stmt => {
      const type = this.typeChecker.getTypeAtLocation(stmt);
      const symbol = type.aliasSymbol || type.symbol;
      if (symbol === undefined) {
        throw new Error(
          "can't determine symbol of: " + TypescriptHelpers.describeNode(stmt)
        );
      }
      output[symbol.name] = getValidatorFor(stmt, type, this.typeChecker);
    });

    return output;
  }
}
