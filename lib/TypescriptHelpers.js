"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
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
function typeIsObject(type) {
    return flagsMatch(type.flags, ts.TypeFlags.Object);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHlwZXNjcmlwdEhlbHBlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvVHlwZXNjcmlwdEhlbHBlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBaUM7QUFFakMsNEJBQW1DLEVBQWlCO0lBQ2xELE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUMzQixDQUFDO0FBRkQsZ0RBRUM7QUFFRCxzQkFBNkIsSUFBYTtJQUN4QyxNQUFNLFFBQVEsR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDL0MsT0FBTyxTQUFTLFFBQVEsR0FBRyxDQUFDO0FBQzlCLENBQUM7QUFIRCxvQ0FHQztBQUVELGtCQUF5QixJQUFhLEVBQUUsTUFBZTtJQUNyRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMzQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUM1QyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyRSxDQUFDO0FBSkQsNEJBSUM7QUFFRCxvQkFBb0IsU0FBdUI7SUFDekMsT0FBTyxDQUNMLFNBQVMsQ0FBQyxTQUFTO1FBQ25CLFNBQVMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQztZQUNuRSxTQUFTLENBQ1osQ0FBQztBQUNKLENBQUM7QUFFRCxxQkFDRSxVQUF5QjtJQUV6QixPQUFPLFVBQVUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ2xELENBQUM7QUFKRCxrQ0FJQztBQUVELDBCQUNFLElBQWEsRUFDYixTQUF5RDtJQUV6RCxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN6QyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDdEYsQ0FBQztBQU5ELDRDQU1DO0FBRUQsb0JBQ0UsS0FBUSxFQUNSLGFBQWdCO0lBR2hCLE9BQU8sQ0FBQyxLQUFLLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBRXZDLENBQUM7QUFQRCxnQ0FPQztBQUVELHlCQUNFLEtBQVEsRUFDUixjQUFtQjtJQUVuQixPQUFPLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQzNDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQ2pDLENBQUM7QUFDSixDQUFDO0FBUEQsMENBT0M7QUFFRCxzQkFBNkIsSUFBYTtJQUN4QyxPQUFPLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDckQsQ0FBQztBQUZELG9DQUVDO0FBRUQsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLEdBQUcsQ0FBQztJQUN0QyxXQUFXO0NBQ1osQ0FBQyxDQUFDO0FBRUgsK0JBQXNDLElBQWEsRUFBRSxRQUFnQjtJQUNuRSxJQUFJLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQzFDLE1BQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDLEdBQUcsUUFBUSxDQUFDLENBQUM7S0FDL0Q7SUFFRCxPQUFPLGdCQUFnQixDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsRUFBRTtRQUNqRCxJQUFJLE9BQU8sS0FBSyxXQUFXLEVBQUU7WUFDM0IsTUFBTSxLQUFLLEdBQUcsQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3JELEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQ3hCLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUU7b0JBQzNDLE1BQU0sSUFBSSxLQUFLLENBQUMscUNBQXFDLEdBQUcsU0FBUyxDQUFDLENBQUM7aUJBQ3BFO1lBQ0gsQ0FBQyxDQUFDLENBQUM7WUFDSCxPQUFPLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDakM7YUFBTTtZQUNMLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7SUFDSCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFsQkQsc0RBa0JDIn0=