import * as ts from 'typescript';
import * as TypescriptHelpers from "./TypescriptHelpers";


function run() {
  const rootNames = ['inputs/test.ts'];

  const options: ts.CompilerOptions = {};

  const program = ts.createProgram(rootNames, options);

  const typeChecker = program.getTypeChecker();

  program.getSourceFiles().forEach(sourceFile => {
    if (rootNames.indexOf(sourceFile.fileName) !== -1) {
      console.log(`============ ${sourceFile.fileName}`);
      TypescriptHelpers.findExports(sourceFile, program).forEach(stmt => {
        const type = typeChecker.getTypeAtLocation(stmt);
        const symbol = type.aliasSymbol || type.symbol;
        if (symbol === undefined) {
          throw new Error("can't determine symbol of: " + TypescriptHelpers.describeNode(stmt));
        }
        console.log("export", symbol.name);
        const validator = TypescriptHelpers.getValidatorFor(stmt, type, typeChecker);
        console.log("validator", JSON.stringify(validator.describe(), null, 2));
        // type.getProperties().forEach(prop => {
        //   const propType = typeChecker.getTypeOfSymbolAtLocation(prop, stmt);

        //   console.log(
        //     "property",
        //     prop.name,
        //     prop.flags,
        //     propType.flags,
        //     TypescriptHelpers.typeIsPrimitive(propType)
        //   );
        // });
        // TypescriptHelpers.dumpNode(stmt);
        // console.log("type", typeChecker.getTypeAtLocation(stmt));
      });
    }
  });
}

run();
