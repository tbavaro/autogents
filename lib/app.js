"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const TypescriptHelpers = require("./TypescriptHelpers");
const ValidationGenerator_1 = require("./ValidationGenerator");
function run() {
    const rootName = "src/ValidationGenerator.TestTypes.ts";
    console.log(TypescriptHelpers.syntaxKindToString(ts.SyntaxKind.ArrowFunction));
    const generator = new ValidationGenerator_1.default([rootName]);
    console.log(generator.serializeValidators());
}
run();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlDQUFpQztBQUNqQyx5REFBeUQ7QUFFekQsK0RBQXdEO0FBR3hEO0lBQ0UsTUFBTSxRQUFRLEdBQUcsc0NBQXNDLENBQUM7SUFFeEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7SUFDL0UsTUFBTSxTQUFTLEdBQUcsSUFBSSw2QkFBbUIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFhdEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO0FBQy9DLENBQUM7QUFFRCxHQUFHLEVBQUUsQ0FBQyJ9