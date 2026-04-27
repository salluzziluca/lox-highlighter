
import { Token, TokenType } from './tokens';
import { Expr, Stmt } from './ast';

export class Parser {
	private tokens: Token[];
	private current: number = 0;

	constructor(tokens: Token[]) {
		this.tokens = tokens;
	}

	// ─── API pública ────────────────────────────────────────────────────────────

	parse(): Stmt[] {
		const statements: Stmt[] = [];
		while (!this._isAtEnd()) {
			statements.push(this._statement());
		}
		return statements;
	}

	// ─── Navegación ─────────────────────────────────────────────────────────────


	private _peek(): Token {
		return this.tokens[this.current];
	}


	private _previous(): Token {
		return this.tokens[this.current - 1];
	}

	private _isAtEnd(): boolean {
		return this._peek().tokenType === TokenType.EOF;
	}

	private _advance(): Token {
		if (!this._isAtEnd()) {
			this.current++;
		}
		return this._previous();
	}

	private _check(type: TokenType): boolean {
		if (this._isAtEnd()) return false;
		return this._peek().tokenType === type;
	}

	private _match(...types: TokenType[]): boolean {
		for (const type of types) {
			if (this._check(type)) {
				this._advance();
				return true;
			}
		}
		return false;
	}

	private _consume(type: TokenType, message: string): Token {
		if (this._check(type)) return this._advance();
		throw new ParseError(this._peek(), message);
	}

	// ─── Placeholder ────────────────────────────────────────────────────────────

	private _statement(): Stmt {
		throw new ParseError(this._peek(), 'Statements aún no implementados');
	}

	private _primary(): Expr {
		if (this._match(TokenType.FALSE)) return { kind: 'Literal', value: false };
		if (this._match(TokenType.TRUE)) return { kind: 'Literal', value: true };
		if (this._match(TokenType.NIL)) return { kind: 'Literal', value: null };

		if (this._match(TokenType.NUMBER, TokenType.STRING)) {
			return { kind: 'Literal', value: this._previous().literal as number | string };
		}

		if (this._match(TokenType.IDENTIFIER)) {
			return { kind: 'Variable', name: this._previous() };
		}

		if (this._match(TokenType.LEFT_PAREN)) {
			const expression = this._primary(); // por ahora solo primarias adentro
			this._consume(TokenType.RIGHT_PAREN, "Se esperaba ')' después de la expresión");
			return { kind: 'Grouping', expression };
		}

		throw new ParseError(this._peek(), 'Se esperaba una expresión');
	}
}

export class ParseError extends Error {
	token: Token;

	constructor(token: Token, message: string) {
		super(message);
		this.token = token;
	}
}

