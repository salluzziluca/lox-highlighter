"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = require("vscode");
const scanner_1 = require("./scanner");
const tokens_1 = require("./tokens");
const parser_1 = require("./parser");
const resolver_1 = require("./resolver");
const semantic_resolver_1 = require("./semantic-resolver");
const usage_resolver_1 = require("./usage-resolver");
const tokenTypes = new Map();
const tokenModifiers = new Map();
const legend = (function () {
    const tokenTypesLegend = [
        'comment', 'string', 'keyword', 'number', 'regexp', 'operator', 'namespace',
        'type', 'struct', 'class', 'interface', 'enum', 'typeParameter', 'function',
        'method', 'decorator', 'macro', 'variable', 'parameter', 'property', 'label'
    ];
    tokenTypesLegend.forEach((tokenType, index) => tokenTypes.set(tokenType, index));
    const tokenModifiersLegend = [
        'declaration', 'documentation', 'readonly', 'static', 'abstract', 'deprecated',
        'modification', 'async'
    ];
    tokenModifiersLegend.forEach((tokenModifier, index) => tokenModifiers.set(tokenModifier, index));
    return new vscode.SemanticTokensLegend(tokenTypesLegend, tokenModifiersLegend);
})();
function activate(context) {
    context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: 'lox' }, new DocumentSemanticTokensProvider(), legend));
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('lox');
    context.subscriptions.push(diagnosticCollection);
    const updateDiagnostics = (document) => {
        if (document.languageId !== 'lox') {
            return;
        }
        const diagnostics = [];
        try {
            const tokens = new scanner_1.Scanner(document.getText()).scan();
            const stmts = new parser_1.Parser(tokens).parse();
            const semanticErrors = new semantic_resolver_1.SemanticResolver().resolve(stmts);
            const usageDiagnostics = new usage_resolver_1.UsageResolver().resolve(stmts);
            for (const semanticError of semanticErrors) {
                diagnostics.push(toDiagnostic(semanticError));
            }
            for (const usageDiagnostic of usageDiagnostics) {
                diagnostics.push(toUnnecessaryDiagnostic(document, usageDiagnostic));
            }
        }
        catch (error) {
            if (error instanceof parser_1.ParseError) {
                diagnostics.push(toDiagnostic({
                    token: error.token,
                    message: error.message
                }));
            }
        }
        diagnosticCollection.set(document.uri, diagnostics);
    };
    if (vscode.window.activeTextEditor) {
        updateDiagnostics(vscode.window.activeTextEditor.document);
    }
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
        updateDiagnostics(event.document);
    }));
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(document => {
        updateDiagnostics(document);
    }));
}
class DocumentSemanticTokensProvider {
    async provideDocumentSemanticTokens(document, _token) {
        const allTokens = this._parseText(document.getText());
        const builder = new vscode.SemanticTokensBuilder();
        allTokens.forEach((token) => {
            builder.push(token.line, token.startCharacter, token.length, this._encodeTokenType(token.tokenType), this._encodeTokenModifiers(token.tokenModifiers));
        });
        return builder.build();
    }
    _encodeTokenType(tokenType) {
        if (tokenTypes.has(tokenType)) {
            return tokenTypes.get(tokenType);
        }
        else if (tokenType === 'notInLegend') {
            return tokenTypes.size + 2;
        }
        return 0;
    }
    _encodeTokenModifiers(strTokenModifiers) {
        let result = 0;
        for (const tokenModifier of strTokenModifiers) {
            if (tokenModifiers.has(tokenModifier)) {
                result = result | (1 << tokenModifiers.get(tokenModifier));
            }
            else if (tokenModifier === 'notInLegend') {
                result = result | (1 << tokenModifiers.size + 2);
            }
        }
        return result;
    }
    _parseText(text) {
        const tokens = new scanner_1.Scanner(text).scan();
        let semanticMap = new Map();
        try {
            const stmts = new parser_1.Parser(tokens).parse();
            semanticMap = new resolver_1.Resolver().resolve(stmts);
        }
        catch {
            // si el código tiene errores de parseo, usamos solo el scanner
            // pero aplicamos una heurística mínima para no perder color semántico:
            // - `fun <identifier>` => function
            // - `var <identifier>` => variable
            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                if (token.tokenType === tokens_1.TokenType.FUN) {
                    const next = tokens[i + 1];
                    if (next && next.tokenType === tokens_1.TokenType.IDENTIFIER) {
                        semanticMap.set(`${next.line}:${next.column}`, 'function');
                    }
                }
                if (token.tokenType === tokens_1.TokenType.VAR) {
                    const next = tokens[i + 1];
                    if (next && next.tokenType === tokens_1.TokenType.IDENTIFIER) {
                        semanticMap.set(`${next.line}:${next.column}`, 'variable');
                    }
                }
            }
        }
        return tokens
            .filter(t => t.tokenType !== tokens_1.TokenType.EOF)
            .map(t => toIParsedToken(t, semanticMap));
    }
}
function toIParsedToken(token, semanticMap) {
    const semanticType = semanticMap.get(`${token.line}:${token.column}`);
    return {
        line: token.line - 1,
        startCharacter: token.column - 1,
        length: token.lexeme.length,
        tokenType: semanticType ?? tokenTypeToVSCode(token.tokenType),
        tokenModifiers: []
    };
}
function toDiagnostic(error) {
    const range = new vscode.Range(error.token.line - 1, error.token.column - 1, error.token.line - 1, error.token.column - 1 + Math.max(1, error.token.lexeme.length));
    return new vscode.Diagnostic(range, error.message, vscode.DiagnosticSeverity.Error);
}
function toUnnecessaryDiagnostic(document, diagnostic) {
    let range;
    if (diagnostic.kind === 'unreachable') {
        const startLine = diagnostic.start.line - 1;
        const endLine = diagnostic.end.line - 1;
        const endLineText = document.lineAt(endLine).text;
        range = new vscode.Range(startLine, 0, endLine, endLineText.length);
    }
    else {
        range = new vscode.Range(diagnostic.start.line - 1, diagnostic.start.column - 1, diagnostic.end.line - 1, diagnostic.end.column - 1 + Math.max(1, diagnostic.end.lexeme.length));
    }
    const vscodeDiagnostic = new vscode.Diagnostic(range, diagnostic.message, vscode.DiagnosticSeverity.Hint);
    vscodeDiagnostic.tags = [vscode.DiagnosticTag.Unnecessary];
    return vscodeDiagnostic;
}
function tokenTypeToVSCode(type) {
    switch (type) {
        case tokens_1.TokenType.IF:
        case tokens_1.TokenType.ELSE:
        case tokens_1.TokenType.WHILE:
        case tokens_1.TokenType.FOR:
        case tokens_1.TokenType.FUN:
        case tokens_1.TokenType.VAR:
        case tokens_1.TokenType.RETURN:
        case tokens_1.TokenType.AND:
        case tokens_1.TokenType.OR:
        case tokens_1.TokenType.TRUE:
        case tokens_1.TokenType.FALSE:
        case tokens_1.TokenType.NIL:
        case tokens_1.TokenType.PRINT: return 'keyword';
        case tokens_1.TokenType.NUMBER: return 'number';
        case tokens_1.TokenType.STRING: return 'string';
        case tokens_1.TokenType.IDENTIFIER: return 'variable';
        case tokens_1.TokenType.COMMENT: return 'comment';
        default: return 'operator';
    }
}
//# sourceMappingURL=extension.js.map