import * as ts from "typescript";
export declare function syntaxKindToString(sk: ts.SyntaxKind): string;
export declare function describeNode(node: ts.Node): string;
export declare function dumpNode(node: ts.Node, indent?: number): void;
export declare function findExports(sourceFile: ts.SourceFile, program: ts.Program): ts.Statement[];
export declare function flagsMatch<T extends number>(flags: T, predicateFlag: T): boolean;
export declare function flagsMatchOneOf<T extends number>(flags: T, predicateFlags: T[]): boolean;
export declare function typeIsObject(type: ts.Type): boolean;
