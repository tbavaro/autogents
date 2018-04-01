import * as ts from 'typescript';

// XCXC this isn't guaranteed to work across typescript versions, but i probably don't
// need it for too long anyway
const syntaxKindNameMap: { [k: number]: string } = {
  0: "Unknown",
  1: "EndOfFileToken",
  2: "SingleLineCommentTrivia",
  3: "MultiLineCommentTrivia",
  4: "NewLineTrivia",
  5: "WhitespaceTrivia",
  6: "ShebangTrivia",
  7: "ConflictMarkerTrivia",
  8: "NumericLiteral",
  9: "StringLiteral",
  10: "JsxText",
  11: "JsxTextAllWhiteSpaces",
  12: "RegularExpressionLiteral",
  13: "NoSubstitutionTemplateLiteral",
  14: "TemplateHead",
  15: "TemplateMiddle",
  16: "TemplateTail",
  17: "OpenBraceToken",
  18: "CloseBraceToken",
  19: "OpenParenToken",
  20: "CloseParenToken",
  21: "OpenBracketToken",
  22: "CloseBracketToken",
  23: "DotToken",
  24: "DotDotDotToken",
  25: "SemicolonToken",
  26: "CommaToken",
  27: "LessThanToken",
  28: "LessThanSlashToken",
  29: "GreaterThanToken",
  30: "LessThanEqualsToken",
  31: "GreaterThanEqualsToken",
  32: "EqualsEqualsToken",
  33: "ExclamationEqualsToken",
  34: "EqualsEqualsEqualsToken",
  35: "ExclamationEqualsEqualsToken",
  36: "EqualsGreaterThanToken",
  37: "PlusToken",
  38: "MinusToken",
  39: "AsteriskToken",
  40: "AsteriskAsteriskToken",
  41: "SlashToken",
  42: "PercentToken",
  43: "PlusPlusToken",
  44: "MinusMinusToken",
  45: "LessThanLessThanToken",
  46: "GreaterThanGreaterThanToken",
  47: "GreaterThanGreaterThanGreaterThanToken",
  48: "AmpersandToken",
  49: "BarToken",
  50: "CaretToken",
  51: "ExclamationToken",
  52: "TildeToken",
  53: "AmpersandAmpersandToken",
  54: "BarBarToken",
  55: "QuestionToken",
  56: "ColonToken",
  57: "AtToken",
  58: "EqualsToken",
  59: "PlusEqualsToken",
  60: "MinusEqualsToken",
  61: "AsteriskEqualsToken",
  62: "AsteriskAsteriskEqualsToken",
  63: "SlashEqualsToken",
  64: "PercentEqualsToken",
  65: "LessThanLessThanEqualsToken",
  66: "GreaterThanGreaterThanEqualsToken",
  67: "GreaterThanGreaterThanGreaterThanEqualsToken",
  68: "AmpersandEqualsToken",
  69: "BarEqualsToken",
  70: "CaretEqualsToken",
  71: "Identifier",
  72: "BreakKeyword",
  73: "CaseKeyword",
  74: "CatchKeyword",
  75: "ClassKeyword",
  76: "ConstKeyword",
  77: "ContinueKeyword",
  78: "DebuggerKeyword",
  79: "DefaultKeyword",
  80: "DeleteKeyword",
  81: "DoKeyword",
  82: "ElseKeyword",
  83: "EnumKeyword",
  84: "ExportKeyword",
  85: "ExtendsKeyword",
  86: "FalseKeyword",
  87: "FinallyKeyword",
  88: "ForKeyword",
  89: "FunctionKeyword",
  90: "IfKeyword",
  91: "ImportKeyword",
  92: "InKeyword",
  93: "InstanceOfKeyword",
  94: "NewKeyword",
  95: "NullKeyword",
  96: "ReturnKeyword",
  97: "SuperKeyword",
  98: "SwitchKeyword",
  99: "ThisKeyword",
  100: "ThrowKeyword",
  101: "TrueKeyword",
  102: "TryKeyword",
  103: "TypeOfKeyword",
  104: "VarKeyword",
  105: "VoidKeyword",
  106: "WhileKeyword",
  107: "WithKeyword",
  108: "ImplementsKeyword",
  109: "InterfaceKeyword",
  110: "LetKeyword",
  111: "PackageKeyword",
  112: "PrivateKeyword",
  113: "ProtectedKeyword",
  114: "PublicKeyword",
  115: "StaticKeyword",
  116: "YieldKeyword",
  117: "AbstractKeyword",
  118: "AsKeyword",
  119: "AnyKeyword",
  120: "AsyncKeyword",
  121: "AwaitKeyword",
  122: "BooleanKeyword",
  123: "ConstructorKeyword",
  124: "DeclareKeyword",
  125: "GetKeyword",
  126: "InferKeyword",
  127: "IsKeyword",
  128: "KeyOfKeyword",
  129: "ModuleKeyword",
  130: "NamespaceKeyword",
  131: "NeverKeyword",
  132: "ReadonlyKeyword",
  133: "RequireKeyword",
  134: "NumberKeyword",
  135: "ObjectKeyword",
  136: "SetKeyword",
  137: "StringKeyword",
  138: "SymbolKeyword",
  139: "TypeKeyword",
  140: "UndefinedKeyword",
  141: "UniqueKeyword",
  142: "FromKeyword",
  143: "GlobalKeyword",
  144: "OfKeyword",
  145: "QualifiedName",
  146: "ComputedPropertyName",
  147: "TypeParameter",
  148: "Parameter",
  149: "Decorator",
  150: "PropertySignature",
  151: "PropertyDeclaration",
  152: "MethodSignature",
  153: "MethodDeclaration",
  154: "Constructor",
  155: "GetAccessor",
  156: "SetAccessor",
  157: "CallSignature",
  158: "ConstructSignature",
  159: "IndexSignature",
  160: "TypePredicate",
  161: "TypeReference",
  162: "FunctionType",
  163: "ConstructorType",
  164: "TypeQuery",
  165: "TypeLiteral",
  166: "ArrayType",
  167: "TupleType",
  168: "UnionType",
  169: "IntersectionType",
  170: "ConditionalType",
  171: "InferType",
  172: "ParenthesizedType",
  173: "ThisType",
  174: "TypeOperator",
  175: "IndexedAccessType",
  176: "MappedType",
  177: "LiteralType",
  178: "ObjectBindingPattern",
  179: "ArrayBindingPattern",
  180: "BindingElement",
  181: "ArrayLiteralExpression",
  182: "ObjectLiteralExpression",
  183: "PropertyAccessExpression",
  184: "ElementAccessExpression",
  185: "CallExpression",
  186: "NewExpression",
  187: "TaggedTemplateExpression",
  188: "TypeAssertionExpression",
  189: "ParenthesizedExpression",
  190: "FunctionExpression",
  191: "ArrowFunction",
  192: "DeleteExpression",
  193: "TypeOfExpression",
  194: "VoidExpression",
  195: "AwaitExpression",
  196: "PrefixUnaryExpression",
  197: "PostfixUnaryExpression",
  198: "BinaryExpression",
  199: "ConditionalExpression",
  200: "TemplateExpression",
  201: "YieldExpression",
  202: "SpreadElement",
  203: "ClassExpression",
  204: "OmittedExpression",
  205: "ExpressionWithTypeArguments",
  206: "AsExpression",
  207: "NonNullExpression",
  208: "MetaProperty",
  209: "TemplateSpan",
  210: "SemicolonClassElement",
  211: "Block",
  212: "VariableStatement",
  213: "EmptyStatement",
  214: "ExpressionStatement",
  215: "IfStatement",
  216: "DoStatement",
  217: "WhileStatement",
  218: "ForStatement",
  219: "ForInStatement",
  220: "ForOfStatement",
  221: "ContinueStatement",
  222: "BreakStatement",
  223: "ReturnStatement",
  224: "WithStatement",
  225: "SwitchStatement",
  226: "LabeledStatement",
  227: "ThrowStatement",
  228: "TryStatement",
  229: "DebuggerStatement",
  230: "VariableDeclaration",
  231: "VariableDeclarationList",
  232: "FunctionDeclaration",
  233: "ClassDeclaration",
  234: "InterfaceDeclaration",
  235: "TypeAliasDeclaration",
  236: "EnumDeclaration",
  237: "ModuleDeclaration",
  238: "ModuleBlock",
  239: "CaseBlock",
  240: "NamespaceExportDeclaration",
  241: "ImportEqualsDeclaration",
  242: "ImportDeclaration",
  243: "ImportClause",
  244: "NamespaceImport",
  245: "NamedImports",
  246: "ImportSpecifier",
  247: "ExportAssignment",
  248: "ExportDeclaration",
  249: "NamedExports",
  250: "ExportSpecifier",
  251: "MissingDeclaration",
  252: "ExternalModuleReference",
  253: "JsxElement",
  254: "JsxSelfClosingElement",
  255: "JsxOpeningElement",
  256: "JsxClosingElement",
  257: "JsxFragment",
  258: "JsxOpeningFragment",
  259: "JsxClosingFragment",
  260: "JsxAttribute",
  261: "JsxAttributes",
  262: "JsxSpreadAttribute",
  263: "JsxExpression",
  264: "CaseClause",
  265: "DefaultClause",
  266: "HeritageClause",
  267: "CatchClause",
  268: "PropertyAssignment",
  269: "ShorthandPropertyAssignment",
  270: "SpreadAssignment",
  271: "EnumMember",
  272: "SourceFile",
  273: "Bundle",
  274: "JSDocTypeExpression",
  275: "JSDocAllType",
  276: "JSDocUnknownType",
  277: "JSDocNullableType",
  278: "JSDocNonNullableType",
  279: "JSDocOptionalType",
  280: "JSDocFunctionType",
  281: "JSDocVariadicType",
  282: "JSDocComment",
  283: "JSDocTypeLiteral",
  284: "JSDocTag",
  285: "JSDocAugmentsTag",
  286: "JSDocClassTag",
  287: "JSDocParameterTag",
  288: "JSDocReturnTag",
  289: "JSDocTypeTag",
  290: "JSDocTemplateTag",
  291: "JSDocTypedefTag",
  292: "JSDocPropertyTag",
  293: "SyntaxList",
  294: "NotEmittedStatement",
  295: "PartiallyEmittedExpression",
  296: "CommaListExpression",
  297: "MergeDeclarationMarker",
  298: "EndOfDeclarationMarker",
  299: "Count"
};

export function syntaxKindToString(sk: ts.SyntaxKind): string {
  return syntaxKindNameMap[sk] || `unknown#${sk}`;
}

export function describeNode(node: ts.Node) {
  const kindName = syntaxKindToString(node.kind);
  return `node (${kindName})`;
}

export function dumpNode(node: ts.Node, indent?: number) {
  const indentStr = "  ".repeat(indent || 0);
  console.log(indentStr + describeNode(node));
  ts.forEachChild(node, child => dumpNode(child, (indent || 0) + 1));
}

function isExported(statement: ts.Statement) {
  return statement.modifiers && (statement.modifiers.find(m => m.kind === ts.SyntaxKind.ExportKeyword) !== undefined);
}

export function findExports(sourceFile: ts.SourceFile, program: ts.Program): ts.Statement[] {
  return sourceFile.statements.filter(isExported);
}

// types
const primitiveTypeFlagsToTypeOfString = new Map<ts.TypeFlags, string>();
primitiveTypeFlagsToTypeOfString.set(ts.TypeFlags.String, "string");
primitiveTypeFlagsToTypeOfString.set(ts.TypeFlags.Number, "number");
primitiveTypeFlagsToTypeOfString.set(ts.TypeFlags.Boolean, "boolean");

const primitiveTypeFlags = Array.from(primitiveTypeFlagsToTypeOfString.keys());

function flagsMatch<T extends number>(flags: T, predicateFlag: T): boolean {
  /* tslint:disable:no-bitwise */
  return ((flags & predicateFlag) !== 0);
}

function flagsMatchOneOf<T extends number>(flags: T, predicateFlags: T[]): boolean {
  return !!predicateFlags.find(predicateFlag => flagsMatch(flags, predicateFlag));
}

export function typeIsPrimitive(type: ts.Type): boolean {
  return flagsMatchOneOf(type.flags, primitiveTypeFlags);
}

export function typeIsObject(type: ts.Type): boolean {
  return flagsMatch(type.flags, ts.TypeFlags.Object);
}

export abstract class Validator {
  public readonly validatorTypeName: string;

  constructor(validatorTypeName: string) {
    this.validatorTypeName = validatorTypeName;
  }

  public describe(): { [key: string]: {} } {
    let result = { type: this.validatorTypeName };
    const more = this.describeMore();
    if (more) {
      /* tslint:disable:prefer-object-spread */
      result = Object.assign(result, more);
    }
    return result;
  }

  protected describeMore(): { [key: string]: {} } | undefined {
    return undefined;
  }
}

const undefinedValidator = new (class extends Validator {
  constructor() {
    super("UndefinedValidator");
  }
});

class OrValidator extends Validator {
  public readonly validators: Validator[];

  constructor(validators: Validator[]) {
    super("OrValidator");
    this.validators = validators;
  }

  protected describeMore() {
    return {
      validators: this.validators.map(validator => validator.describe())
    };
  }
}

class ObjectValidator extends Validator {
  private propertyValidators: Map<string, Validator>;

  constructor(
    objectName: string,
    declarationNode: ts.Node,
    properties: ts.Symbol[],
    typeChecker: ts.TypeChecker
  ) {
    super("ObjectValidator");
    this.propertyValidators = new Map();
    properties.forEach(property => {
        const propType = typeChecker.getTypeOfSymbolAtLocation(property, declarationNode);
        console.log(property.name);
        let validator = getValidatorFor(declarationNode, propType, typeChecker);
        if (flagsMatch(property.flags, ts.SymbolFlags.Optional)) {
          validator = new OrValidator([validator, undefinedValidator]);
        }
        this.propertyValidators.set(
          property.name,
          validator
        );

        // console.log(
        //   "property",
        //   property.name,
        //   property.flags,
        //   propType.flags,
        //   typeIsPrimitive(propType)
        // );
    });
  }

  public describeMore() {
    const childDescriptions: any = {};
    this.propertyValidators.forEach((validator, propertyName) => {
      childDescriptions[propertyName] = validator.describe();
    });
    return {
      children: childDescriptions
    };
  }
}

class PrimitiveValidator extends Validator {
  public readonly typeOfString: string;

  constructor(typeOfString: string) {
    super("PrimitiveValidator");
    this.typeOfString = typeOfString;
  }

  protected describeMore() {
    return {
      typeOfString: this.typeOfString
    };
  }
}

type ReusableValidatorEntry = {
  predicate: (type: ts.Type) => boolean;
  validator: Validator;
};

const reusableValidators: ReusableValidatorEntry[] = [];
primitiveTypeFlagsToTypeOfString.forEach((typeOfString, flag) => {
  reusableValidators.push({
    predicate: ((type: ts.Type) => flagsMatch(type.flags, flag)),
    validator: new PrimitiveValidator(typeOfString)
  });
});

export function getValidatorFor(
  declarationNode: ts.Node,
  type: ts.Type,
  typeChecker: ts.TypeChecker
): Validator {
  if (typeIsObject(type)) {
    return new ObjectValidator("some object", declarationNode, type.getProperties(), typeChecker);
  } else {
    const reusableValidatorEntry = reusableValidators.find(entry => entry.predicate(type));
    if (reusableValidatorEntry) {
      return reusableValidatorEntry.validator;
    } else {
      const typeStr = typeChecker.typeToString(type);
      throw new Error(`unable to figure out validator for: ${typeStr}`);
    }
  }
}
