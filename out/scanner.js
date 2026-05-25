"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scanner = void 0;
const tokens_1 = require("./tokens");
class Scanner {
    source;
    tokens = [];
    start = 0;
    current = 0;
    line = 1;
    column = 1;
    startLine = 1;
    startColumn = 1;
    constructor(source) {
        this.source = source;
    }
    scan() {
        while (!this._isAtEnd()) {
            this.start = this.current;
            this.startLine = this.line;
            this.startColumn = this.column;
            this._scanToken();
        }
        this.start = this.current;
        this.startLine = this.line;
        this.startColumn = this.column;
        this._addToken(tokens_1.TokenType.EOF);
        return this.tokens;
    }
    _isAtEnd() {
        return this.current >= this.source.length;
    }
    _scanToken() {
        const c = this._advance();
        switch (c) {
            case '(':
                this._addToken(tokens_1.TokenType.LEFT_PAREN);
                break;
            case ')':
                this._addToken(tokens_1.TokenType.RIGHT_PAREN);
                break;
            case '{':
                this._addToken(tokens_1.TokenType.LEFT_BRACE);
                break;
            case '}':
                this._addToken(tokens_1.TokenType.RIGHT_BRACE);
                break;
            case ',':
                this._addToken(tokens_1.TokenType.COMMA);
                break;
            case ';':
                this._addToken(tokens_1.TokenType.SEMICOLON);
                break;
            case '%':
                this._addToken(tokens_1.TokenType.PERCENT);
                break;
            case '?':
                this._addToken(tokens_1.TokenType.QUESTION);
                break;
            case ':':
                this._addToken(tokens_1.TokenType.COLON);
                break;
            case '-':
                this._addToken(tokens_1.TokenType.MINUS);
                break;
            case '+':
                this._addToken(this._match('+') ? tokens_1.TokenType.PLUS_PLUS : tokens_1.TokenType.PLUS);
                break;
            case '*':
                this._addToken(this._match('*') ? tokens_1.TokenType.STAR_STAR : tokens_1.TokenType.STAR);
                break;
            case '!':
                this._addToken(this._match('=') ? tokens_1.TokenType.BANG_EQUAL : tokens_1.TokenType.BANG);
                break;
            case '=':
                this._addToken(this._match('=') ? tokens_1.TokenType.EQUAL_EQUAL : tokens_1.TokenType.EQUAL);
                break;
            case '<':
                this._addToken(this._match('=') ? tokens_1.TokenType.LESS_EQUAL : tokens_1.TokenType.LESS);
                break;
            case '>':
                this._addToken(this._match('=') ? tokens_1.TokenType.GREATER_EQUAL : tokens_1.TokenType.GREATER);
                break;
            case '/':
                if (this._match('/')) {
                    while (!this._isAtEnd() && this._peek() !== '\n') {
                        this._advance();
                    }
                    this._addToken(tokens_1.TokenType.COMMENT);
                }
                else {
                    this._addToken(tokens_1.TokenType.SLASH);
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
                }
                else if (this._isAlpha(c)) {
                    this._identifier();
                }
                break;
        }
    }
    _advance() {
        const c = this.source[this.current];
        this.current += 1;
        this.column += 1;
        return c;
    }
    _addToken(tokenType, literal = null) {
        this.tokens.push({
            tokenType,
            lexeme: this.source.substring(this.start, this.current),
            literal,
            line: this.startLine,
            column: this.startColumn,
        });
    }
    _match(expected) {
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
    _peek() {
        return this._isAtEnd() ? '\0' : this.source[this.current];
    }
    _peekNext() {
        return this.current + 1 >= this.source.length ? '\0' : this.source[this.current + 1];
    }
    _string() {
        while (!this._isAtEnd() && this._peek() !== '"') {
            if (this._peek() === '\n') {
                this.line += 1;
                this.column = 1;
            }
            this._advance();
        }
        if (this._isAtEnd()) {
            this._addToken(tokens_1.TokenType.STRING, this.source.substring(this.start + 1, this.current));
            return;
        }
        this._advance();
        this._addToken(tokens_1.TokenType.STRING, this.source.substring(this.start + 1, this.current - 1));
    }
    _number() {
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
        this._addToken(tokens_1.TokenType.NUMBER, literal);
    }
    _identifier() {
        while (this._isAlphaNumeric(this._peek())) {
            this._advance();
        }
        const text = this.source.substring(this.start, this.current);
        const keywordType = tokens_1.TokenKeywords[text];
        if (keywordType !== undefined) {
            if (keywordType === tokens_1.TokenType.FALSE) {
                this._addToken(keywordType, false);
                return;
            }
            if (keywordType === tokens_1.TokenType.TRUE) {
                this._addToken(keywordType, true);
                return;
            }
            if (keywordType === tokens_1.TokenType.NIL) {
                this._addToken(keywordType, null);
                return;
            }
            this._addToken(keywordType);
            return;
        }
        this._addToken(tokens_1.TokenType.IDENTIFIER);
    }
    _isDigit(c) {
        return c >= '0' && c <= '9';
    }
    _isAlpha(c) {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
    }
    _isAlphaNumeric(c) {
        return this._isAlpha(c) || this._isDigit(c);
    }
}
exports.Scanner = Scanner;
//# sourceMappingURL=scanner.js.map