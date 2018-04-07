import * as ts from "typescript";

export function syntaxKindToString(sk: ts.SyntaxKind): string {
  return ts.SyntaxKind[sk];
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
  return (
    statement.modifiers &&
    statement.modifiers.find(m => m.kind === ts.SyntaxKind.ExportKeyword) !==
      undefined
  );
}

export function findExports(
  sourceFile: ts.SourceFile
): ts.Statement[] {
  return sourceFile.statements.filter(isExported);
}

export function hasJSDocMatching(
  node: ts.Node,
  predicate: (tagName: string, comment?: string) => boolean
): boolean {
  const tags = ts.getJSDocTags(node) || [];
  return tags.findIndex(tag => predicate(ts.idText(tag.tagName), tag.comment)) !== -1;
}

export function flagsMatch<T extends number>(
  flags: T,
  predicateFlag: T
): boolean {
  /* tslint:disable:no-bitwise */
  return (flags & predicateFlag) !== 0;
  /* tslint:enable */
}

export function flagsMatchOneOf<T extends number>(
  flags: T,
  predicateFlags: T[]
): boolean {
  return !!predicateFlags.find(predicateFlag =>
    flagsMatch(flags, predicateFlag)
  );
}

export function typeIsObject(type: ts.Type): boolean {
  return flagsMatch(type.flags, ts.TypeFlags.Object);
}

const validAutogentsFlagNames = new Set([
  "validator"
]);

export function hasAutogentsJSDocFlag(node: ts.Node, flagName: string) {
  if (!validAutogentsFlagNames.has(flagName)) {
    throw new Error("looking for invalid flag name: " + flagName);
  }

  return hasJSDocMatching(node, (tagName, comment) => {
    if (tagName === "autogents") {
      const flags = (comment || "").trim().split(/[,\s]+/);
      flags.forEach(foundFlag => {
        if (!validAutogentsFlagNames.has(foundFlag)) {
          throw new Error("found invalid autogents flag name: " + foundFlag);
        }
      });
      return flags.includes(flagName);
    } else {
      return false;
    }
  });
}