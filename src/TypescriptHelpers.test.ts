import * as ts from "typescript";
import * as TypescriptHelpers from "./TypescriptHelpers";
import { assertDefined } from "./Utils";

const sourceFileName = "src/TypescriptHelpers.TestTypes.ts";
let program: ts.Program;
let sourceFile: ts.SourceFile;

beforeAll(() => {
  program = ts.createProgram([sourceFileName], {});
  sourceFile = assertDefined(program.getSourceFile(sourceFileName));
});

afterAll(() => {
  program = null as any;
  sourceFile = null as any;
});

function getSymbolDefinedAt(stmt: ts.Statement): string {
  if (ts.isTypeAliasDeclaration(stmt)) {
    return ts.idText(stmt.name);
  } else {
    throw new Error("unsupported: " + JSON.stringify(stmt));
  }
}

function getExportedStatementDefiningSymbol(symbol: string): ts.Statement {
  const statements = TypescriptHelpers.findExports(sourceFile);
  const result = statements.find(stmt => getSymbolDefinedAt(stmt) === symbol);
  if (!result) {
    throw new Error("can't find symbol: " + symbol);
  } else {
    return result;
  }
}

it("find exported types", () => {
  const exportedTypeNames = TypescriptHelpers.findExports(sourceFile).map(getSymbolDefinedAt);
  expect(exportedTypeNames).toContain("ExportedType");
  expect(exportedTypeNames).not.toContain("UnexportedType");
});

function isAdorned(tagName: string) {
  return tagName === "isadorned";
}

it("unadorned type does not have @isadorned jsdoc tag", () => {
  const stmt = getExportedStatementDefiningSymbol("UnadornedType");
  expect(TypescriptHelpers.hasJSDocMatching(stmt, isAdorned)).toBeFalsy();
});

it("adorned type does have @isadorned jsdoc tag", () => {
  const stmt = getExportedStatementDefiningSymbol("AdornedType");
  expect(TypescriptHelpers.hasJSDocMatching(stmt, isAdorned)).toBeTruthy();
});

function hasValidatorFlag(node: ts.Node) {
  return TypescriptHelpers.hasAutogentsJSDocFlag(node, "validator");
}

it("adorned type does not have validator flag", () => {
  const stmt = getExportedStatementDefiningSymbol("AdornedType");
  expect(hasValidatorFlag(stmt)).toBeFalsy();
});

it("ValidatorGeneratedType type does have validator flag", () => {
  const stmt = getExportedStatementDefiningSymbol("ValidatorGeneratedType");
  expect(hasValidatorFlag(stmt)).toBeTruthy();
});

it("BadFlagGeneratedType type throws error when looking at flags", () => {
  const stmt = getExportedStatementDefiningSymbol("BadFlagGeneratedType");
  expect(() => hasValidatorFlag(stmt)).toThrow();
});
