"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const util_1 = require("util");
const Utils_1 = require("./Utils");
function syntaxKindToString(sk) {
    return ts.SyntaxKind[sk];
}
exports.syntaxKindToString = syntaxKindToString;
function describeNode(node) {
    const kindName = syntaxKindToString(node.kind);
    return `node (${kindName})`;
}
exports.describeNode = describeNode;
function dumpNode(node, indent) {
    const indentStr = "  ".repeat(indent || 0);
    console.log(indentStr + describeNode(node));
    ts.forEachChild(node, child => dumpNode(child, (indent || 0) + 1));
}
exports.dumpNode = dumpNode;
function isExported(statement) {
    return (statement.modifiers &&
        statement.modifiers.find(m => m.kind === ts.SyntaxKind.ExportKeyword) !==
            undefined);
}
function findExports(sourceFile) {
    return sourceFile.statements.filter(isExported);
}
exports.findExports = findExports;
function hasJSDocMatching(node, predicate) {
    const tags = ts.getJSDocTags(node) || [];
    return tags.findIndex(tag => predicate(ts.idText(tag.tagName), tag.comment)) !== -1;
}
exports.hasJSDocMatching = hasJSDocMatching;
function flagsMatch(flags, predicateFlag) {
    return (flags & predicateFlag) !== 0;
}
exports.flagsMatch = flagsMatch;
function flagsMatchOneOf(flags, predicateFlags) {
    return !!predicateFlags.find(predicateFlag => flagsMatch(flags, predicateFlag));
}
exports.flagsMatchOneOf = flagsMatchOneOf;
function isPowerOfTwo(n) {
    return (n !== 0 && ((n & (n - 1)) === 0));
}
function flagsToStrings(flagType, flags) {
    const output = [];
    for (const flagKey of Object.keys(flagType)) {
        const flagValue = flagType[flagKey];
        if (util_1.isNumber(flagValue) && isPowerOfTwo(flagValue)) {
            if (flags & flagValue) {
                output.push(flagKey);
            }
            console.log(flagKey, typeof flagValue, flagValue);
        }
    }
    return output;
}
function nodeFlagsToStrings(flags) {
    return flagsToStrings(ts.NodeFlags, flags);
}
exports.nodeFlagsToStrings = nodeFlagsToStrings;
function objectTypeIsArray(type) {
    if (!type.symbol || type.symbol.name !== "Array") {
        return false;
    }
    const declarations = Utils_1.assertDefined(type.symbol.declarations);
    return declarations.every(d => d.getSourceFile().fileName.endsWith("typescript/lib/lib.d.ts"));
}
function typeIsObjectOrArray(type) {
    return flagsMatch(type.flags, ts.TypeFlags.Object);
}
function typeIsArray(type) {
    return typeIsObjectOrArray(type) && objectTypeIsArray(type);
}
exports.typeIsArray = typeIsArray;
function typeIsObject(type) {
    return typeIsObjectOrArray(type) && !objectTypeIsArray(type);
}
exports.typeIsObject = typeIsObject;
const validAutogentsFlagNames = new Set([
    "validator"
]);
function hasAutogentsJSDocFlag(node, flagName) {
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
        }
        else {
            return false;
        }
    });
}
exports.hasAutogentsJSDocFlag = hasAutogentsJSDocFlag;
function getTypeArguments(type) {
    return type.typeArguments;
}
function getArrayElementType(type) {
    if (!typeIsArray(type)) {
        throw new Error("type must be array!");
    }
    const typeArguments = Utils_1.assertDefined(getTypeArguments(type));
    if (typeArguments.length !== 1) {
        throw new Error("expected exactly 1 type argument for Array");
    }
    else {
        return typeArguments[0];
    }
}
exports.getArrayElementType = getArrayElementType;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHlwZXNjcmlwdEhlbHBlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvVHlwZXNjcmlwdEhlbHBlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBaUM7QUFDakMsK0JBQWdDO0FBQ2hDLG1DQUF3QztBQUV4Qyw0QkFBbUMsRUFBaUI7SUFDbEQsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzNCLENBQUM7QUFGRCxnREFFQztBQUVELHNCQUE2QixJQUFhO0lBQ3hDLE1BQU0sUUFBUSxHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQyxPQUFPLFNBQVMsUUFBUSxHQUFHLENBQUM7QUFDOUIsQ0FBQztBQUhELG9DQUdDO0FBRUQsa0JBQXlCLElBQWEsRUFBRSxNQUFlO0lBQ3JELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzNDLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzVDLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JFLENBQUM7QUFKRCw0QkFJQztBQUVELG9CQUFvQixTQUF1QjtJQUN6QyxPQUFPLENBQ0wsU0FBUyxDQUFDLFNBQVM7UUFDbkIsU0FBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDO1lBQ25FLFNBQVMsQ0FDWixDQUFDO0FBQ0osQ0FBQztBQUVELHFCQUNFLFVBQXlCO0lBRXpCLE9BQU8s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