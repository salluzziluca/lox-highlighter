import * as vscode from 'vscode';
import { Scanner } from './scanner';
import { Token, TokenType } from './tokens';
import { Parser, ParseError } from './parser';
import { Resolver as TokenResolver } from './resolver';
import { SemanticResolver, ResolverDiagnostic } from './semantic-resolver';
import { UsageDiagnostic, UsageResolver } from './usage-resolver';
const tokenTypes = new Map<string, number>();
const tokenModifiers = new Map<string, number>();

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

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: 'lox' }, new DocumentSemanticTokensProvider(), legend));

	const diagnosticCollection =
		vscode.languages.createDiagnosticCollection('lox');

	context.subscriptions.push(diagnosticCollection);

	const updateDiagnostics = (document: vscode.TextDocument) => {
		if (document.languageId !== 'lox') {
			return;
		}

		const diagnostics: vscode.Diagnostic[] = [];

		try {
			const tokens = new Scanner(document.getText()).scan();
			const stmts = new Parser(tokens).parse();
			const semanticErrors = new SemanticResolver().resolve(stmts);
			const usageDiagnostics = new UsageResolver().resolve(stmts);

			for (const semanticError of semanticErrors) {
				diagnostics.push(toDiagnostic(semanticError));
			}

			for (const usageDiagnostic of usageDiagnostics) {
				diagnostics.push(toUnnecessaryDiagnostic(document, usageDiagnostic));
			}
		} catch (error) {
			if (error instanceof ParseError) {
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

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(event => {
			updateDiagnostics(event.document);
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument(document => {
			updateDiagnostics(document);
		})
	);
}

interface IParsedToken {
	line: number;
	startCharacter: number;
	length: number;
	tokenType: string;
	tokenModifiers: string[];
}

class DocumentSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
	async provideDocumentSemanticTokens(document: vscode.TextDocument, _token: vscode.CancellationToken): Promise<vscode.SemanticTokens> {
		const allTokens = this._parseText(document.getText());
		const builder = new vscode.SemanticTokensBuilder();
		allTokens.forEach((token) => {
			builder.push(token.line, token.startCharacter, token.length, this._encodeTokenType(token.tokenType), this._encodeTokenModifiers(token.tokenModifiers));
		});
		return builder.build();
	}

	private _encodeTokenType(tokenType: string): number {
		if (tokenTypes.has(tokenType)) {
			return tokenTypes.get(tokenType)!;
		} else if (tokenType === 'notInLegend') {
			return tokenTypes.size + 2;
		}
		return 0;
	}

	private _encodeTokenModifiers(strTokenModifiers: string[]): number {
		let result = 0;
		for (const tokenModifier of strTokenModifiers) {
			if (tokenModifiers.has(tokenModifier)) {
				result = result | (1 << tokenModifiers.get(tokenModifier)!);
			} else if (tokenModifier === 'notInLegend') {
				result = result | (1 << tokenModifiers.size + 2);
			}
		}
		return result;
	}

	private _parseText(text: string): IParsedToken[] {
		const tokens = new Scanner(text).scan();

		let semanticMap = new Map<string, string>();
		try {
			const stmts = new Parser(tokens).parse();
			semanticMap = new TokenResolver().resolve(stmts);
		} catch {
			// si el código tiene errores de parseo, usamos solo el scanner
			// pero aplicamos una heurística mínima para no perder color semántico:
			// - `fun <identifier>` => function
			// - `var <identifier>` => variable
			for (let i = 0; i < tokens.length; i++) {
				const token = tokens[i];

				if (token.tokenType === TokenType.FUN) {
					const next = tokens[i + 1];
					if (next && next.tokenType === TokenType.IDENTIFIER) {
						semanticMap.set(`${next.line}:${next.column}`, 'function');
					}
				}

				if (token.tokenType === TokenType.VAR) {
					const next = tokens[i + 1];
					if (next && next.tokenType === TokenType.IDENTIFIER) {
						semanticMap.set(`${next.line}:${next.column}`, 'variable');
					}
				}
			}
		}

		return tokens
			.filter(t => t.tokenType !== TokenType.EOF)
			.map(t => toIParsedToken(t, semanticMap));
	}


	private _parseTextToken(text: string): { tokenType: string; tokenModifiers: string[]; } {
		const parts = text.split('.');
		return {
			tokenType: parts[0],
			tokenModifiers: parts.slice(1)
		};
	}

}


function toIParsedToken(token: Token, semanticMap: Map<string, string>): IParsedToken {
	const semanticType = semanticMap.get(`${token.line}:${token.column}`);
	return {
		line: token.line - 1,
		startCharacter: token.column - 1,
		length: token.lexeme.length,
		tokenType: semanticType ?? tokenTypeToVSCode(token.tokenType),
		tokenModifiers: []
	};
}

function toDiagnostic(error: ResolverDiagnostic | { token: Token; message: string }): vscode.Diagnostic {
	const range = new vscode.Range(
		error.token.line - 1,
		error.token.column - 1,
		error.token.line - 1,
		error.token.column - 1 + Math.max(1, error.token.lexeme.length)
	);

	return new vscode.Diagnostic(range, error.message, vscode.DiagnosticSeverity.Error);
}

function toUnnecessaryDiagnostic(document: vscode.TextDocument, diagnostic: UsageDiagnostic): vscode.Diagnostic {
	let range: vscode.Range;

	if (diagnostic.kind === 'unreachable') {
		const startLine = diagnostic.start.line - 1;
		const endLine = diagnostic.end.line - 1;
		const endLineText = document.lineAt(endLine).text;
		range = new vscode.Range(startLine, 0, endLine, endLineText.length);
	} else {
		range = new vscode.Range(
			diagnostic.start.line - 1,
			diagnostic.start.column - 1,
			diagnostic.end.line - 1,
			diagnostic.end.column - 1 + Math.max(1, diagnostic.end.lexeme.length)
		);
	}

	const vscodeDiagnostic = new vscode.Diagnostic(range, diagnostic.message, vscode.DiagnosticSeverity.Hint);
	vscodeDiagnostic.tags = [vscode.DiagnosticTag.Unnecessary];
	return vscodeDiagnostic;
}

function tokenTypeToVSCode(type: TokenType): string {
	switch (type) {
		case TokenType.IF:
		case TokenType.ELSE:
		case TokenType.WHILE:
		case TokenType.FOR:
		case TokenType.FUN:
		case TokenType.VAR:
		case TokenType.RETURN:
		case TokenType.AND:
		case TokenType.OR:
		case TokenType.TRUE:
		case TokenType.FALSE:
		case TokenType.NIL:
		case TokenType.PRINT: return 'keyword';
		case TokenType.NUMBER: return 'number';
		case TokenType.STRING: return 'string';
		case TokenType.IDENTIFIER: return 'variable';
		case TokenType.COMMENT: return 'comment';
		default: return 'operator';
	}
}
