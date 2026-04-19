import { Token, TokenKeywords, TokenType } from './tokens';

export class Scanner {
	private source: string;
	private tokens: Token[] = [];
	private start: number = 0;
	private current: number = 0;
	private line: number = 1;
	private column: number = 1;
	private startLine: number = 1;
	private startColumn: number = 1;

	constructor(source: string) {
		this.source = source;
	}

	scan(): Token[] {
		while (!this._isAtEnd()) {
			this.start = this.current;
			this.startLine = this.line;
			this.startColumn = this.column;
			this._scanToken();
		}

		this.start = this.current;
		this.startLine = this.line;
		this.startColumn = this.column;
		this._addToken(TokenType.EOF);

		return this.tokens;
	}

	private _isAtEnd(): boolean {
		return this.current >= this.source.length;
	}

	private _scanToken(): void {
		const c = this._advance();

		switch (c) {
			case '(': this._addToken(TokenType.LEFT_PAREN); break;
			case ')': this._addToken(TokenType.RIGHT_PAREN); break;
			case '{': this._addToken(TokenType.LEFT_BRACE); break;
			case '}': this._addToken(TokenType.RIGHT_BRACE); break;
			case ',': this._addToken(TokenType.COMMA); break;
			case ';': this._addToken(TokenType.SEMICOLON); break;
			case '%': this._addToken(TokenType.PERCENT); break;
			case '?': this._addToken(TokenType.QUESTION); break;
			case ':': this._addToken(TokenType.COLON); break;
			case '-': this._addToken(TokenType.MINUS); break;
			case '+':
				this._addToken(this._match('+') ? TokenType.PLUS_PLUS : TokenType.PLUS);
				break;
			case '*':
				this._addToken(this._match('*') ? TokenType.STAR_STAR : TokenType.STAR);
				break;
			case '!':
				this._addToken(this._match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
				break;
			case '=':
				this._addToken(this._match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
				break;
			case '<':
				this._addToken(this._match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
				break;
			case '>':
				this._addToken(this._match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER);
				break;
			case '/':
				if (this._match('/')) {
					while (!this._isAtEnd() && this._peek() !== '\n') {
						this._advance();
					}
				} else {
					this._addToken(TokenType.SLASH);
				}
				break;
			case ' ':
			case '\r':
			case '\t':
				break;
			case '\n':
				this.line += 1;
				this.column = 1;
				break;
			case '"':
				this._string();
				break;
			default:
				if (this._isDigit(c)) {
					this._number();
				} else if (this._isAlpha(c)) {
					this._identifier();
				}
				break;
		}
	}

	private _advance(): string {
		const c = this.source[this.current];
		this.current += 1;
		this.column += 1;
		return c;
	}

	private _addToken(tokenType: TokenType, literal: number | string | boolean | null = null): void {
		this.tokens.push({
			tokenType,
			lexeme: this.source.substring(this.start, this.current),
			literal,
			line: this.startLine,
			column: this.startColumn,
		});
	}

	private _match(expected: string): boolean {
		if (this._isAtEnd()) {
			return false;
		}

		if (this.source[this.current] !== expected) {
			return false;
		}

		this.current += 1;
		this.column += 1;
		return true;
	}

	private _peek(): string {
		return this._isAtEnd() ? '\0' : this.source[this.current];
	}

	private _peekNext(): string {
		return this.current + 1 >= this.source.length ? '\0' : this.source[this.current + 1];
	}

	private _string(): void {
		while (!this._isAtEnd() && this._peek() !== '"') {
			if (this._peek() === '\n') {
				this.line += 1;
				this.column = 1;
			}
			this._advance();
		}

		if (this._isAtEnd()) {
			this._addToken(TokenType.STRING, this.source.substring(this.start + 1, this.current));
			return;
		}

		this._advance();
		this._addToken(TokenType.STRING, this.source.substring(this.start + 1, this.current - 1));
	}

	private _number(): void {
		while (this._isDigit(this._peek())) {
			this._advance();
		}

		if (this._peek() === '.' && this._isDigit(this._peekNext())) {
			this._advance();
			while (this._isDigit(this._peek())) {
				this._advance();
			}
		}

		const literal = Number(this.source.substring(this.start, this.current));
		this._addToken(TokenType.NUMBER, literal);
	}

	private _identifier(): void {
		while (this._isAlphaNumeric(this._peek())) {
			this._advance();
		}

		const text = this.source.substring(this.start, this.current);
		const keywordType = TokenKeywords[text];

		if (keywordType !== undefined) {
			if (keywordType === TokenType.FALSE) {
				this._addToken(keywordType, false);
				return;
			}
			if (keywordType === TokenType.TRUE) {
				this._addToken(keywordType, true);
				return;
			}
			if (keywordType === TokenType.NIL) {
				this._addToken(keywordType, null);
				return;
			}
			this._addToken(keywordType);
			return;
		}

		this._addToken(TokenType.IDENTIFIER);
	}

	private _isDigit(c: string): boolean {
		return c >= '0' && c <= '9';
	}

	private _isAlpha(c: string): boolean {
		return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
	}

	private _isAlphaNumeric(c: string): boolean {
		return this._isAlpha(c) || this._isDigit(c);
	}
}