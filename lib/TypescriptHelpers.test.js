"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const TypescriptHelpers = require("./TypescriptHelpers");
const Utils_1 = require("./Utils");
const sourceFileName = "src/TypescriptHelpers.TestTypes.ts";
let program;
let typeChecker;
let sourceFile;
beforeAll(() => {
    program = ts.createProgram([sourceFileName], {});
    typeChecker = program.getTypeChecker();
    sourceFile = Utils_1.assertDefined(program.getSourceFile(sourceFileName));
});
afterAll(() => {
    program = null;
    typeChecker = null;
    sourceFile = null;
});
function getSymbolDefinedAt(stmt) {
    if (ts.isTypeAliasDeclaration(stmt)) {
        return ts.idText(stmt.name);
    }
    else {
        throw new Error("unsupported: " + JSON.stringify(stmt));
    }
}
function getTypeDefinedAt(stmt) {
    if (ts.isTypeAliasDeclaration(stmt)) {
        return typeChecker.getTypeAtLocation(stmt);
    }
    else {
        throw new Error("unsupported: " + JSON.stringify(stmt));
    }
}
function getExportedStatementDefiningSymbol(symbol) {
    const statements = TypescriptHelpers.findExports(sourceFile);
    const result = statements.find(stmt => getSymbolDefinedAt(stmt) === symbol);
    if (!result) {
        throw new Error("can't find symbol: " + symbol);
    }
    else {
        return result;
    }
}
it("find exported types", () => {
    const exportedTypeNames = TypescriptHelpers.findExports(sourceFile).map(getSymbolDefinedAt);
    expect(exportedTypeNames).toContain("ExportedType");
    expect(exportedTypeNames).not.toContain("UnexportedType");
});
function isAdorned(tagName) {
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
function hasValidatorFlag(node) {
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
it("getArrayElementType works for arrays like number[]", () => {
    const stmt = getExportedStatementDefiningSymbol("BracketedNumberArrayType");
    const type = getTypeDefinedAt(stmt);
    expect(TypescriptHelpers.typeIsArray(type)).toBeTruthy();
    const elementType = TypescriptHelpers.getArrayElementType(type);
    expect(elementType.flags).toBe(ts.TypeFlags.Number);
});
it("getArrayElementType works for arrays like Array<number>", () => {
    const stmt = getExportedStatementDefiningSymbol("GenericNumberArrayType");
    const type = getTypeDefinedAt(stmt);
    expect(TypescriptHelpers.typeIsArray(type)).toBeTruthy();
    const elementType = TypescriptHelpers.getArrayElementType(type);
    expect(elementType.flags).toBe(ts.TypeFlags.Number);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHlwZXNjcmlwdEhlbHBlcnMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9UeXBlc2NyaXB0SGVscGVycy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaUNBQWlDO0FBQ2pDLHlEQUF5RDtBQUN6RCxtQ0FBd0M7QUFFeEMsTUFBTSxjQUFjLEdBQUcsb0NBQW9DLENBQUM7QUFDNUQsSUFBSSxPQUFtQixDQUFDO0FBQ3hCLElBQUksV0FBMkIsQ0FBQztBQUNoQyxJQUFJLFVBQXlCLENBQUM7QUFFOUIsU0FBUyxDQUFDLEdBQUcsRUFBRTtJQUNiLE9BQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLENBQUMsY0FBYyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDakQsV0FBVyxHQUFHLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQztJQUN2QyxVQUFVLEdBQUcscUJBQWEsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7QUFDcEUsQ0FBQyxDQUFDLENBQUM7QUFFSCxRQUFRLENBQUMsR0FBRyxFQUFFO0lBQ1osT0FBTyxHQUFHLElBQVcsQ0FBQztJQUN0QixXQUFXLEdBQUcsSUFBVyxDQUFDO0lBQzFCLFVBQVUsR0FBRyxJQUFXLENBQUM7QUFDM0IsQ0FBQyxDQUFDLENBQUM7QUFFSCw0QkFBNEIsSUFBa0I7SUFDNUMsSUFBSSxFQUFFLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDbkMsT0FBTyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUM3QjtTQUFNO1FBQ0wsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0tBQ3pEO0FBQ0gsQ0FBQztBQUVELDBCQUEwQixJQUFrQjtJQUMxQyxJQUFJLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJ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