"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const TypescriptHelpers = require("./TypescriptHelpers");
const Utils_1 = require("./Utils");
const sourceFileName = "src/TypescriptHelpers.TestTypes.ts";
let program;
let sourceFile;
beforeAll(() => {
    program = ts.createProgram([sourceFileName], {});
    sourceFile = Utils_1.assertDefined(program.getSourceFile(sourceFileName));
});
afterAll(() => {
    program = null;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHlwZXNjcmlwdEhlbHBlcnMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9UeXBlc2NyaXB0SGVscGVycy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaUNBQWlDO0FBQ2pDLHlEQUF5RDtBQUN6RCxtQ0FBd0M7QUFFeEMsTUFBTSxjQUFjLEdBQUcsb0NBQW9DLENBQUM7QUFDNUQsSUFBSSxPQUFtQixDQUFDO0FBQ3hCLElBQUksVUFBeUIsQ0FBQztBQUU5QixTQUFTLENBQUMsR0FBRyxFQUFFO0lBQ2IsT0FBTyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxjQUFjLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNqRCxVQUFVLEdBQUcscUJBQWEsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7QUFDcEUsQ0FBQyxDQUFDLENBQUM7QUFFSCxRQUFRLENBQUMsR0FBRyxFQUFFO0lBQ1osT0FBTyxHQUFHLElBQVcsQ0FBQztJQUN0QixVQUFVLEdBQUcsSUFBVyxDQUFDO0FBQzNCLENBQUMsQ0FBQyxDQUFDO0FBRUgsNEJBQTRCLElBQWtCO0lBQzVDLElBQUksRUFBRSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ25DLE9BQU8sRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDN0I7U0FBTTtRQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztLQUN6RDtBQUNILENBQUM7QUFFRCw0Q0FBNEMsTUFBYztJQUN4RCxNQUFNLFVBQVUsR0FBRyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDN0QsTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxLQUFLLE1BQU0sQ0FBQyxDQUFDO0lBQzVFLElBQUksQ0FBQyxNQUFNLEVBQUU7UUFDWCxNQUFNLElBQUksS0FBSyxDQUFDLHFCQUFxQixHQUFHLE1BQU0sQ0FBQyxDQUFDO0tBQ2pEO1NBQU07UUFDTCxPQUFPLE1BQU0sQ0FBQztLQUNmO0FBQ0gsQ0FBQztBQUVELEVBQUUsQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7SUFDN0IsTUFBTSxpQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDNUYsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQ3BELE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUM1RCxDQUFDLENBQUMsQ0FBQztBQUVILG1CQUFtQixPQUFlO0lBQ2hDLE9BQU8sT0FBTyxLQUFLLFdBQVcsQ0FBQztBQUNqQyxDQUFDO0FBRUQsRUFBRSxDQUFDLG1EQUFtRCxFQUFFLEdBQUcsRUFBRTtJQUMzRCxNQUFNLElBQUksR0FBRyxrQ0FBa0MsQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUNqRSxNQUFNLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDMUUsQ0FBQyxDQUFDLENBQUM7QUFFSCxFQUFFLENBQUMsNkNBQTZDLEVBQUUsR0FBRyxFQUFFO0lBQ3JELE1BQU0sSUFBSSxHQUFHLGtDQUFrQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQy9ELE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUMzRSxDQUFDLENBQUMsQ0FBQztBQUVILDBCQUEwQixJQUFhO0lBQ3JDLE9BQU8saUJBQWlCLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQ3BFLENBQUM7QUFFRCxFQUFFLENBQUMsMkNBQTJDLEVBQUUsR0FBRyxFQUFFO0lBQ25ELE1BQU0sSUFBSSxHQUFHLGtDQUFrQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQy9ELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQzdDLENBQUMsQ0FBQyxDQUFDO0FBRUgsRUFBRSxDQUFDLHNEQUFzRCxFQUFFLEdBQUcsRUFBRTtJQUM5RCxNQUFNLElBQUksR0FBRyxrQ0FBa0MsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0lBQzFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQzlDLENBQUMsQ0FBQyxDQUFDO0FBRUgsRUFBRSxDQUFDLDhEQUE4RCxFQUFFLEdBQUcsRUFBRTtJQUN0RSxNQUFNLElBQUksR0FBRyxrQ0FBa0MsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0lBQ3hFLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ2pELENBQUMsQ0FBQyxDQUFDIn0=