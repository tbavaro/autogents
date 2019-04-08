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
    return declarations.every(d => d.getSourceFile().fileName.match(/typescript\/lib\/lib\.([0-9a-z]*\.)*d\.ts$/) !== null);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHlwZXNjcmlwdEhlbHBlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvVHlwZXNjcmlwdEhlbHBlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBaUM7QUFDakMsK0JBQWdDO0FBQ2hDLG1DQUF3QztBQUV4QyxTQUFnQixrQkFBa0IsQ0FBQyxFQUFpQjtJQUNsRCxPQUFPLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDM0IsQ0FBQztBQUZELGdEQUVDO0FBRUQsU0FBZ0IsWUFBWSxDQUFDLElBQWE7SUFDeEMsTUFBTSxRQUFRLEdBQUcsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQy9DLE9BQU8sU0FBUyxRQUFRLEdBQUcsQ0FBQztBQUM5QixDQUFDO0FBSEQsb0NBR0M7QUFFRCxTQUFnQixRQUFRLENBQUMsSUFBYSxFQUFFLE1BQWU7SUFDckQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDM0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDNUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckUsQ0FBQztBQUpELDRCQUlDO0FBRUQsU0FBUyxVQUFVLENBQUMsU0FBdUI7SUFDekMsT0FBTyxDQUNMLFNBQVMsQ0FBQyxTQUFTO1FBQ25CLFNBQVMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQztZQUNuRSxTQUFTLENBQ1osQ0FBQztB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