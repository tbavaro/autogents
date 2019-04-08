import * as ts from "typescript";
import { isNumber } from "util";
import { assertDefined } from "./Utils";

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

function isPowerOfTwo(n: number): boolean {
  /* tslint:disable:no-bitwise */
  return (n !== 0 && ((n & (n - 1)) === 0));
  /* tslint:enable*/
}

function flagsToStrings(flagType: any, flags: any): string[] {
  const output: string[] = [];
  for (const flagKey of Object.keys(flagType)) {
    const flagValue = flagType[flagKey];
    if (isNumber(flagValue) && isPowerOfTwo(flagValue)) {
      /* tslint:disable:no-bitwise */
      if (flags & flagValue) {
        output.push(flagKey);
      }
      /* tslint:enable */
      console.log(flagKey, typeof flagValue, flagValue);
    }
  }
  return output;
}

export function nodeFlagsToStrings(flags: ts.NodeFlags): string[] {
  return flagsToStrings(ts.NodeFlags, flags);
}

function objectTypeIsArray(type: ts.Type): boolean {
  if (!type.symbol || type.symbol.name !== "Array") {
    return false;
  }
  const declarations = assertDefined(type.symbol.declarations);
  return declarations.every(d => d.getSourceFile().fileName.match(/typescript\/lib\/lib\.([0-9a-z]*\.)*d\.ts$/) !== null);
}

function typeIsObjectOrArray(type: ts.Type): boolean {
  return flagsMatch(type.flags, ts.TypeFlags.Object);
}

export function typeIsArray(type: ts.Type): boolean {
  return typeIsObjectOrArray(type) && objectTypeIsArray(type);
}

export function typeIsObject(type: ts.Type): boolean {
  return typeIsObjectOrArray(type) && !objectTypeIsArray(type);
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

function getTypeArguments(type: ts.Type): ts.Type[] | undefined {
  return (type as any).typeArguments;
}

export function getArrayElementType(type: ts.Type): ts.Type {
  if (!typeIsArray(type)) {
    throw new Error("type must be array!");
  }

  const typeArguments = assertDefined(getTypeArguments(type));

  if (typeArguments.length !== 1) {
    throw new Error("expected exactly 1 type argument for Array");
  } else {
    return typeArguments[0];
  }
}
