"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseError = exports.Parser = void 0;
const tokens_1 = require("./tokens");
class Parser {
    tokens;
    current = 0;
    _stmtHandlers = {
        [tokens_1.TokenType.VAR]: () => this._varDecl(),
        [tokens_1.TokenType.PRINT]: () => this._printStmt(),
        [tokens_1.TokenType.IF]: () => this._ifStmt(),
        [tokens_1.TokenType.WHILE]: () => this._whileStmt(),
        [tokens_1.TokenType.FOR]: () => this._forStmt(),
        [tokens_1.TokenType.FUN]: () => this._funDecl(),
        [tokens_1.TokenType.RETURN]: () => this._returnStmt(),
        [tokens_1.TokenType.LEFT_BRACE]: () => this._block(),
    };
    constructor(tokens) {
        this.tokens = tokens;
    }
    parse() {
        const statements = [];
        while (!this._isAtEnd()) {
            if (this._match(tokens_1.TokenType.COMMENT)) {
                continue;
            }
            statements.push(this._statement());
        }
        return statements;
    }
    _peek() {
        return this.tokens[this.current];
    }
    _previous() {
        return this.tokens[this.current - 1];
    }
    _isAtEnd() {
        return this._peek().tokenType === tokens_1.TokenType.EOF;
    }
    _advance() {
        if (!this._isAtEnd()) {
            this.current++;
        }
        return this._previous();
    }
    _check(type) {
        if (this._isAtEnd()) {
            return false;
        }
        return this._peek().tokenType === type;
    }
    _match(...types) {
        for (const type of types) {
            if (this._check(type)) {
                this._advance();
                return true;
            }
        }
        return false;
    }
    _consume(type, message) {
        if (this._check(type)) {
            return this._advance();
        }
        // For missing tokens we choose where to point the error:
        // - For `;` and `)` it's more helpful to point at the previous token
        // - For `}` (missing block close) point at the current token (peek/EOF)
        if (type === tokens_1.TokenType.SEMICOLON || type === tokens_1.TokenType.RIGHT_PAREN) {
            throw new ParseError(this._previous(), message);
        }
        throw new ParseError(this._peek(), message);
    }
    _primary() {
        if (this._match(tokens_1.TokenType.FALSE)) {
            return { kind: 'Literal', value: false };
        }
        if (this._match(tokens_1.TokenType.TRUE)) {
            return { kind: 'Literal', value: true };
        }
        if (this._match(tokens_1.TokenType.NIL)) {
            return { kind: 'Literal', value: null };
        }
        if (this._match(tokens_1.TokenType.NUMBER, tokens_1.TokenType.STRING)) {
            return { kind: 'Literal', value: this._previous().literal };
        }
        if (this._match(tokens_1.TokenType.IDENTIFIER)) {
            return { kind: 'Variable', name: this._previous() };
        }
        if (this._match(tokens_1.TokenType.LEFT_PAREN)) {
            const expression = this._expression();
            this._consume(tokens_1.TokenType.RIGHT_PAREN, "Se esperaba ')' después de la expresión");
            return { kind: 'Grouping', expression };
        }
        throw new ParseError(this._peek(), 'Se esperaba una expresión');
    }
    _unary() {
        if (this._match(tokens_1.TokenType.BANG, tokens_1.TokenType.MINUS)) {
            const operator = this._previous();
            const right = this._unary();
            return { kind: 'Unary', operator, right };
        }
        return this._call();
    }
    _factor() {
        let left = this._unary();
        while (this._match(tokens_1.TokenType.STAR, tokens_1.TokenType.SLASH, tokens_1.TokenType.PERCENT, tokens_1.TokenType.STAR_STAR)) {
            const operator = this._previous();
            const right = this._unary();
            left = { kind: 'Binary', left, operator, right };
        }
        return left;
    }
    _term() {
        let left = this._factor();
        while (this._match(tokens_1.TokenType.PLUS, tokens_1.TokenType.MINUS)) {
            const operator = this._previous();
            const right = this._factor();
            left = { kind: 'Binary', left, operator, right };
        }
        return left;
    }
    _comparison() {
        let left = this._term();
        while (this._match(tokens_1.TokenType.GREATER, tokens_1.TokenType.GREATER_EQUAL, tokens_1.TokenType.LESS, tokens_1.TokenType.LESS_EQUAL)) {
            const operator = this._previous();
            const right = this._term();
            left = { kind: 'Binary', left, operator, right };
        }
        return left;
    }
    _equality() {
        let left = this._comparison();
        while (this._match(tokens_1.TokenType.EQUAL_EQUAL, tokens_1.TokenType.BANG_EQUAL)) {
            const operator = this._previous();
            const right = this._comparison();
            left = { kind: 'Binary', left, operator, right };
        }
        return left;
    }
    _expression() {
        return this._assignment();
    }
    _or() {
        let left = this._and();
        while (this._match(tokens_1.TokenType.OR)) {
            const operator = this._previous();
            const right = this._and();
            left = { kind: 'Binary', left, operator, right };
        }
        return left;
    }
    _and() {
        let left = this._equality();
        while (this._match(tokens_1.TokenType.AND)) {
            const operator = this._previous();
            const right = this._equality();
            left = { kind: 'Binary', left, operator, right };
        }
        return left;
    }
    _assignment() {
        const expr = this._or();
        if (this._match(tokens_1.TokenType.EQUAL)) {
            const value = this._assignment(); // recursivo para asociatividad derecha
            if (expr.kind === 'Variable') {
                return { kind: 'Assign', name: expr.name, value };
            }
            throw new ParseError(this._previous(), 'Destino de asignación inválido');
        }
        return expr;
    }
    _statement() {
        const handler = this._stmtHandlers[this._peek().tokenType];
        if (handler) {
            this._advance();
            return handler();
        }
        return this._expressionStmt();
    }
    _expressionStmt() {
        const expression = this._expression();
        this._consume(tokens_1.TokenType.SEMICOLON, "Se esperaba ';' después de la expresión");
        return { kind: 'ExpressionStmt', expression };
    }
    _printStmt() {
        const expression = this._expression();
        this._consume(tokens_1.TokenType.SEMICOLON, "Se esperaba ';' después del valor");
        return { kind: 'PrintStmt', expression };
    }
    _varDecl() {
        const name = this._consume(tokens_1.TokenType.IDENTIFIER, "Se esperaba un nombre de variable");
        const initializer = this._match(tokens_1.TokenType.EQUAL) ? this._expression() : null;
        this._consume(tokens_1.TokenType.SEMICOLON, "Se esperaba ';' después de la declaración");
        return { kind: 'VarDecl', name, initializer };
    }
    _block() {
        const statements = [];
        while (!this._check(tokens_1.TokenType.RIGHT_BRACE) && !this._isAtEnd()) {
            if (this._match(tokens_1.TokenType.COMMENT)) {
                continue;
            }
            statements.push(this._statement());
        }
        this._consume(tokens_1.TokenType.RIGHT_BRACE, "Se esperaba '}' al final del bloque");
        return { kind: 'Block', statements };
    }
    _ifStmt() {
        this._consume(tokens_1.TokenType.LEFT_PAREN, "Se esperaba '(' después de 'if'");
        const condition = this._expression();
        this._consume(tokens_1.TokenType.RIGHT_PAREN, "Se esperaba ')' después de la condición");
        const thenBranch = this._statement();
        while (this._match(tokens_1.TokenType.COMMENT)) { }
        const elseBranch = this._match(tokens_1.TokenType.ELSE) ? this._statement() : null;
        return { kind: 'IfStmt', condition, thenBranch, elseBranch };
    }
    _whileStmt() {
        this._consume(tokens_1.TokenType.LEFT_PAREN, "Se esperaba '(' después de 'while'");
        const condition = this._expression();
        this._consume(tokens_1.TokenType.RIGHT_PAREN, "Se esperaba ')' después de la condición");
        const body = this._statement();
        return { kind: 'WhileStmt', condition, body };
    }
    _forStmt() {
        this._consume(tokens_1.TokenType.LEFT_PAREN, "Se esperaba '(' después de 'for'");
        let initializer;
        if (this._match(tokens_1.TokenType.SEMICOLON)) {
            initializer = null;
        }
        else if (this._match(tokens_1.TokenType.VAR)) {
            initializer = this._varDecl();
        }
        else {
            initializer = this._expressionStmt();
        }
        const condition = this._check(tokens_1.TokenType.SEMICOLON)
            ? { kind: 'Literal', value: true }
            : this._expression();
        this._consume(tokens_1.TokenType.SEMICOLON, "Se esperaba ';' después de la condición del for");
        const increment = this._check(tokens_1.TokenType.RIGHT_PAREN)
            ? null
            : this._expression();
        this._consume(tokens_1.TokenType.RIGHT_PAREN, "Se esperaba ')' después del incremento");
        let body = this._statement();
        if (increment !== null) {
            body = {
                kind: 'Block',
                statements: [body, { kind: 'ExpressionStmt', expression: increment }]
            };
        }
        const whileLoop = { kind: 'WhileStmt', condition, body };
        if (initializer !== null) {
            return { kind: 'Block', statements: [initializer, whileLoop] };
        }
        return whileLoop;
    }
    _funDecl() {
        const name = this._consume(tokens_1.TokenType.IDENTIFIER, "Se esperaba un nombre de función");
        this._consume(tokens_1.TokenType.LEFT_PAREN, "Se esperaba '(' después del nombre de la función");
        const params = [];
        if (!this._check(tokens_1.TokenType.RIGHT_PAREN)) {
            do {
                params.push(this._consume(tokens_1.TokenType.IDENTIFIER, "Se esperaba un nombre de parámetro"));
            } while (this._match(tokens_1.TokenType.COMMA));
        }
        this._consume(tokens_1.TokenType.RIGHT_PAREN, "Se esperaba ')' después de los parámetros");
        this._consume(tokens_1.TokenType.LEFT_BRACE, "Se esperaba '{' antes del cuerpo de la función");
        const bodyBlock = this._block();
        return { kind: 'FunDecl', name, params, body: bodyBlock.statements };
    }
    _returnStmt() {
        const keyword = this._previous();
        const value = this._check(tokens_1.TokenType.SEMICOLON) ? null : this._expression();
        this._consume(tokens_1.TokenType.SEMICOLON, "Se esperaba ';' después del return");
        return { kind: 'ReturnStmt', keyword, value };
    }
    _call() {
        let expr = this._primary();
        while (this._match(tokens_1.TokenType.LEFT_PAREN)) {
            const args = [];
            if (!this._check(tokens_1.TokenType.RIGHT_PAREN)) {
                do {
                    args.push(this._expression());
                } while (this._match(tokens_1.TokenType.COMMA));
            }
            this._consume(tokens_1.TokenType.RIGHT_PAREN, "Se esperaba ')' después de los argumentos");
            expr = { kind: 'Call', callee: expr, args };
        }
        return expr;
    }
}
exports.Parser = Parser;
class ParseError extends Error {
    token;
    constructor(token, message) {
        super(message);
        this.token = token;
    }
}
exports.ParseError = ParseError;
//# sourceMappingURL=parser.js.map