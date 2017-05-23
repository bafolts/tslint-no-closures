
import * as ts from "typescript";

import * as Lint from "tslint";

declare var global: any;

export class Rule extends Lint.Rules.TypedRule {
    /* tslint:disable:object-literal-sort-keys */
    public static metadata: Lint.IRuleMetadata = {
        ruleName: "no-closures",
        description: "Disallows usage of variables before their declaration.",
        descriptionDetails: Lint.Utils.dedent`
            This rule is primarily useful when using the \`var\` keyword -
            the compiler will detect if a \`let\` and \`const\` variable is used before it is declared.`,
        optionsDescription: "Not configurable.",
        options: null,
        optionExamples: [true],
        type: "functionality",
        typescriptOnly: false,
        requiresTypeInfo: false
    };
    /* tslint:enable:object-literal-sort-keys */

    public static FAILURE_STRING(name: string) {
        return `variable '${name}' used before declaration`;
    }

    public applyWithProgram(sourceFile: ts.SourceFile, program: ts.Program): Lint.RuleFailure[] {
        return this.applyWithFunction(sourceFile, (ctx) => walk(ctx, program.getTypeChecker()));
    }
}

function walk(ctx: Lint.WalkContext<void>, checker: ts.TypeChecker): void {

    return ts.forEachChild(ctx.sourceFile, function recur(node: ts.Node): void {
        switch (node.kind) {
            case ts.SyntaxKind.TypeReference:
                // Ignore types.
                return;
            case ts.SyntaxKind.PropertyAccessExpression:
                let expression = (node as ts.PropertyAccessExpression).expression;
                if (expression.kind === ts.SyntaxKind.ThisKeyword) {
                    // this keyword is fine
                } else {
                    checkProperty(expression);
                }
            case ts.SyntaxKind.Identifier:
                return checkIdentifier(node as ts.Identifier, checker.getSymbolAtLocation(node));
            case ts.SyntaxKind.ExportSpecifier:
                return checkIdentifier(
                    (node as ts.ExportSpecifier).name,
                    checker.getExportSpecifierLocalTargetSymbol(node as ts.ExportSpecifier));
            default:
                return ts.forEachChild(node, recur);
        }
    });

    function checkProperty(node: any): void {
        if (node.text === "arguments") {
            return;
        }
        let crawl = node;
        while (crawl.parent) {
            if (crawl.kind === ts.SyntaxKind.MethodDeclaration) {
                if (!doesFunctionDefine(node.text, crawl)) {
                    ctx.addFailureAtNode(node, "Closures are not allowed! Variable " + node.text + " needs to be defined in the function it is used");
                }
                return;
            } else if (crawl.kind === ts.SyntaxKind.FunctionDeclaration) {
                if (!doesFunctionDefine(node.text, crawl)) {
                    ctx.addFailureAtNode(node, "Closures are not allowed! Variable " + node.text + " needs to be defined in the function it is used");
                }
                return;
            }
            crawl = crawl.parent;
        }
        ctx.addFailureAtNode(node, "Property " + node.text + " used and not defined in class or containing function");
    }

    function doesFunctionDefine(variable: string, node: ts.Node): boolean {
        global.console.log("Check variable " + variable);
        return true;
    }

    function checkIdentifier(node: ts.Identifier, symbol: ts.Symbol | undefined): void {
        if (symbol !== undefined) {
            if (symbol.declarations[0].kind === ts.SyntaxKind.VariableDeclaration &&
                node.parent && node.parent.kind !== ts.SyntaxKind.VariableDeclaration) {
                checkProperty(node);
            } // else if (symbol.declarations[0].kind === ts.SyntaxKind.Parameter &&
              //        node.parent && node.parent.kind === ts.SyntaxKind.Parameter) {
                // global.console.log(node);
                // global.console.log("A parameter is declared name: " + symbol.name);
            else if (symbol.declarations[0].kind === ts.SyntaxKind.Parameter &&
                       node.parent && node.parent.kind !== ts.SyntaxKind.Parameter) {
                checkProperty(node);
            }
        }
    }
}
