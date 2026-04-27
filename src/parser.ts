
import { Token, TokenType } from './tokens';
import { Expr, Stmt } from './ast';

export class Parser {
	private tokens: Token[];
	private current: number = 0;

	constructor(tokens: Token[]) {
		this.tokens = tokens;
	}

	parse(): Stmt[] {
		const statements: Stmt[] = [];
		while (!this._isAtEnd()) {
			statements.push(this._statement());
		}
		return statements;
	}

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
			const expression = this._expression();
			this._consume(TokenType.RIGHT_PAREN, "Se esperaba ')' después de la expresión");
			return { kind: 'Grouping', expression };
		}

		throw new ParseError(this._peek(), 'Se esperaba una expresión');
	}

	private _unary(): Expr {
		if (this._match(TokenType.BANG, TokenType.MINUS)) {
			const operator = this._previous();
			const right = this._unary(); // recursivo para soportar !!x, --x
			return { kind: 'Unary', operator, right };
		}

		return this._primary();
	}

	private _factor(): Expr {
		let left = this._unary();

		while (this._match(TokenType.STAR, TokenType.SLASH, TokenType.PERCENT, TokenType.STAR_STAR)) {
			const operator = this._previous();
			const right = this._unary();
			left = { kind: 'Binary', left, operator, right };
		}

		return left;
	}

	private _term(): Expr {
		let left = this._factor();

		while (this._match(TokenType.PLUS, TokenType.MINUS)) {
			const operator = this._previous();
			const right = this._factor();
			left = { kind: 'Binary', left, operator, right };
		}

		return left;
	}

	private _comparison(): Expr {
		let left = this._term();

		while (this._match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
			const operator = this._previous();
			const right = this._term();
			left = { kind: 'Binary', left, operator, right };
		}

		return left;
	}

	private _equality(): Expr {
		let left = this._comparison();

		while (this._match(TokenType.EQUAL_EQUAL, TokenType.BANG_EQUAL)) {
			const operator = this._previous();
			const right = this._comparison();
			left = { kind: 'Binary', left, operator, right };
		}

		return left;
	}

	private _expression(): Expr {
		return this._assignment();
	}

	private _assignment(): Expr {
		const expr = this._equality();

		if (this._match(TokenType.EQUAL)) {
			const value = this._assignment(); // recursivo para asociatividad derecha

			if (expr.kind === 'Variable') {
				return { kind: 'Assign', name: expr.name, value };
			}

			throw new ParseError(this._previous(), 'Destino de asignación inválido');
		}

		return expr;
	}

}

export class ParseError extends Error {
	token: Token;

	constructor(token: Token, message: string) {
		super(message);
		this.token = token;
	}
}

