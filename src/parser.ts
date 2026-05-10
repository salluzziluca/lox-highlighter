
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

			if (this._match(TokenType.COMMENT)) {
				continue;
			}

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

		if (type === TokenType.SEMICOLON) {
			throw new ParseError(this._previous(), message);
		}

		throw new ParseError(this._peek(), message);
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
			const right = this._unary();
			return { kind: 'Unary', operator, right };
		}

		return this._call();
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

	private _statement(): Stmt {
		if (this._match(TokenType.VAR)) return this._varDecl();
		if (this._match(TokenType.PRINT)) return this._printStmt();
		if (this._match(TokenType.IF)) return this._ifStmt();
		if (this._match(TokenType.WHILE)) return this._whileStmt();
		if (this._match(TokenType.FOR)) return this._forStmt();
		if (this._match(TokenType.FUN)) return this._funDecl();
		if (this._match(TokenType.RETURN)) return this._returnStmt();
		if (this._match(TokenType.LEFT_BRACE)) return this._block();
		return this._expressionStmt();
	}


	private _expressionStmt(): Stmt {
		const expression = this._expression();
		this._consume(TokenType.SEMICOLON, "Se esperaba ';' después de la expresión");
		return { kind: 'ExpressionStmt', expression };
	}


	private _printStmt(): Stmt {
		const expression = this._expression();
		this._consume(TokenType.SEMICOLON, "Se esperaba ';' después del valor");
		return { kind: 'PrintStmt', expression };
	}


	private _varDecl(): Stmt {
		const name = this._consume(TokenType.IDENTIFIER, "Se esperaba un nombre de variable");
		const initializer = this._match(TokenType.EQUAL) ? this._expression() : null;
		this._consume(TokenType.SEMICOLON, "Se esperaba ';' después de la declaración");
		return { kind: 'VarDecl', name, initializer };
	}

	private _block(): Stmt {
		const statements: Stmt[] = [];
		while (!this._check(TokenType.RIGHT_BRACE) && !this._isAtEnd()) {
			if (this._match(TokenType.COMMENT)) {
				continue;
			}

			statements.push(this._statement());
		}
		this._consume(TokenType.RIGHT_BRACE, "Se esperaba '}' al final del bloque");
		return { kind: 'Block', statements };
	}


	private _ifStmt(): Stmt {
		this._consume(TokenType.LEFT_PAREN, "Se esperaba '(' después de 'if'");
		const condition = this._expression();
		this._consume(TokenType.RIGHT_PAREN, "Se esperaba ')' después de la condición");

		const thenBranch = this._statement();
		const elseBranch = this._match(TokenType.ELSE) ? this._statement() : null;

		return { kind: 'IfStmt', condition, thenBranch, elseBranch };
	}

	private _whileStmt(): Stmt {
		this._consume(TokenType.LEFT_PAREN, "Se esperaba '(' después de 'while'");
		const condition = this._expression();
		this._consume(TokenType.RIGHT_PAREN, "Se esperaba ')' después de la condición");
		const body = this._statement();
		return { kind: 'WhileStmt', condition, body };
	}


	private _forStmt(): Stmt {
		this._consume(TokenType.LEFT_PAREN, "Se esperaba '(' después de 'for'");

		let initializer: Stmt | null = null;
		if (this._match(TokenType.SEMICOLON)) {
			initializer = null;
		} else if (this._match(TokenType.VAR)) {
			initializer = this._varDecl();
		} else {
			initializer = this._expressionStmt();
		}

		const condition: Expr = this._check(TokenType.SEMICOLON)
			? { kind: 'Literal', value: true }
			: this._expression();
		this._consume(TokenType.SEMICOLON, "Se esperaba ';' después de la condición del for");

		const increment: Expr | null = this._check(TokenType.RIGHT_PAREN)
			? null
			: this._expression();
		this._consume(TokenType.RIGHT_PAREN, "Se esperaba ')' después del incremento");

		let body = this._statement();

		if (increment !== null) {
			body = {
				kind: 'Block',
				statements: [body, { kind: 'ExpressionStmt', expression: increment }]
			};
		}

		const whileLoop: Stmt = { kind: 'WhileStmt', condition, body };

		if (initializer !== null) {
			return { kind: 'Block', statements: [initializer, whileLoop] };
		}

		return whileLoop;
	}

	private _funDecl(): Stmt {
		const name = this._consume(TokenType.IDENTIFIER, "Se esperaba un nombre de función");
		this._consume(TokenType.LEFT_PAREN, "Se esperaba '(' después del nombre de la función");

		const params: Token[] = [];
		if (!this._check(TokenType.RIGHT_PAREN)) {
			do {
				params.push(this._consume(TokenType.IDENTIFIER, "Se esperaba un nombre de parámetro"));
			} while (this._match(TokenType.COMMA));
		}

		this._consume(TokenType.RIGHT_PAREN, "Se esperaba ')' después de los parámetros");
		this._consume(TokenType.LEFT_BRACE, "Se esperaba '{' antes del cuerpo de la función");

		const body: Stmt[] = [];
		while (!this._check(TokenType.RIGHT_BRACE) && !this._isAtEnd()) {
			body.push(this._statement());
		}
		this._consume(TokenType.RIGHT_BRACE, "Se esperaba '}' al final del cuerpo");

		return { kind: 'FunDecl', name, params, body };
	}

	private _returnStmt(): Stmt {
		const keyword = this._previous();
		const value = this._check(TokenType.SEMICOLON) ? null : this._expression();
		this._consume(TokenType.SEMICOLON, "Se esperaba ';' después del return");
		return { kind: 'ReturnStmt', keyword, value };
	}

	private _call(): Expr {
		let expr = this._primary();

		while (this._match(TokenType.LEFT_PAREN)) {
			const args: Expr[] = [];

			if (!this._check(TokenType.RIGHT_PAREN)) {
				do {
					args.push(this._expression());
				} while (this._match(TokenType.COMMA));
			}

			this._consume(TokenType.RIGHT_PAREN, "Se esperaba ')' después de los argumentos");
			expr = { kind: 'Call', callee: expr, args };
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

