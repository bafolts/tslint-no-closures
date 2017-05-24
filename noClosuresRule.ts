
import * as ts from "typescript";

import * as Lint from "tslint";

declare var global: any;

export class Rule extends Lint.Rules.TypedRule {
    /* tslint:disable:object-literal-sort-keys */
    public static metadata: Lint.IRuleMetadata = {
        ruleName: "no-closures",
        description: "Disallows usage of variables outside of their declaration function.",
        descriptionDetails: Lint.Utils.dedent`
            This rule is primarily useful to avoid memory leaks
            and closure related bugs.`,
        optionsDescription: "Not configurable.",
        options: null,
        optionExamples: [true],
        type: "functionality",
        typescriptOnly: false,
        requiresTypeInfo: false
    };
    /* tslint:enable:object-literal-sort-keys */

    public static FAILURE_STRING(name: string) {
        return `variable '${name}' used as closure`;
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
                } else if (expression.kind === ts.SyntaxKind.Identifier) {
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
        if (node.text === "global") {
            return;
        }
        let crawl = node;
        while (crawl.parent) {
            if (crawl.kind === ts.SyntaxKind.ArrowFunction) {
                if (!doesFunctionDefine(node.text, crawl)) {
                    ctx.addFailureAtNode(node, Rule.FAILURE_STRING(node.text));
                }
                return;
            } else if (crawl.kind === ts.SyntaxKind.MethodDeclaration) {
                if (!doesFunctionDefine(node.text, crawl)) {
                    ctx.addFailureAtNode(node, Rule.FAILURE_STRING(node.text));
                }
                return;
            } else if (crawl.kind === ts.SyntaxKind.FunctionDeclaration) {
                if (!doesFunctionDefine(node.text, crawl)) {
                    ctx.addFailureAtNode(node, Rule.FAILURE_STRING(node.text));
                }
                return;
            }
            crawl = crawl.parent;
        }
    }

    function doesFunctionDefine(variable: string, functionNode: ts.MethodDeclaration | ts.FunctionDeclaration | ts.ConstructorDeclaration): boolean {

        return (functionNode as any).locals.has(variable);

    }

    function checkIdentifier(node: ts.Identifier, symbol: ts.Symbol | undefined): void {
        if (symbol !== undefined) {
            if (symbol.declarations[0].kind === ts.SyntaxKind.VariableDeclaration &&
                node.parent && node.parent.kind !== ts.SyntaxKind.VariableDeclaration) {
                checkProperty(node);
            } else if (symbol.declarations[0].kind === ts.SyntaxKind.Parameter &&
                       node.parent && node.parent.kind !== ts.SyntaxKind.Parameter) {
                checkProperty(node);
            }
        }
    }
}
