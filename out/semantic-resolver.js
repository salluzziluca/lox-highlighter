"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticResolver = void 0;
var FunctionType;
(function (FunctionType) {
    FunctionType[FunctionType["NONE"] = 0] = "NONE";
    FunctionType[FunctionType["FUNCTION"] = 1] = "FUNCTION";
})(FunctionType || (FunctionType = {}));
class SemanticResolver {
    diagnostics = [];
    scopes = [];
    currentFunction = FunctionType.NONE;
    resolve(statements) {
        this.diagnostics = [];
        this.scopes = [];
        this.currentFunction = FunctionType.NONE;
        this._beginScope();
        for (const statement of statements) {
            this._resolveStmt(statement);
        }
        this._endScope();
        return this.diagnostics;
    }
    _resolveStmt(stmt) {
        switch (stmt.kind) {
            case 'VarDecl':
                this._declare(stmt.name, `La variable '${stmt.name.lexeme}' ya fue declarada en este scope`);
                if (stmt.initializer !== null) {
                    this._resolveExpr(stmt.initializer);
                }
                this._define(stmt.name);
                break;
            case 'FunDecl':
                this._declare(stmt.name, `La función '${stmt.name.lexeme}' ya fue declarada en este scope`);
                this._define(stmt.name);
                this._resolveFunction(stmt);
                break;
            case 'Block':
                this._beginScope();
                for (const statement of stmt.statements) {
                    this._resolveStmt(statement);
                }
                this._endScope();
                break;
            case 'ExpressionStmt':
                this._resolveExpr(stmt.expression);
                break;
            case 'PrintStmt':
                this._resolveExpr(stmt.expression);
                break;
            case 'IfStmt':
                this._resolveExpr(stmt.condition);
                this._resolveStmt(stmt.thenBranch);
                if (stmt.elseBranch !== null) {
                    this._resolveStmt(stmt.elseBranch);
                }
                break;
            case 'WhileStmt':
                this._resolveExpr(stmt.condition);
                this._resolveStmt(stmt.body);
                break;
            case 'ReturnStmt':
                if (this.currentFunction === FunctionType.NONE) {
                    this._error(stmt.keyword, "No se puede usar 'return' fuera de una función");
                }
                if (stmt.value !== null) {
                    this._resolveExpr(stmt.value);
                }
                break;
        }
    }
    _resolveFunction(functionDeclaration) {
        const enclosingFunction = this.currentFunction;
        this.currentFunction = FunctionType.FUNCTION;
        this._beginScope();
        for (const param of functionDeclaration.params) {
            this._declare(param, `El parámetro '${param.lexeme}' ya fue declarado en esta función`);
            this._define(param);
        }
        for (const statement of functionDeclaration.body) {
            this._resolveStmt(statement);
        }
        this._endScope();
        this.currentFunction = enclosingFunction;
    }
    _resolveExpr(expr) {
        switch (expr.kind) {
            case 'Literal':
                break;
            case 'Variable':
                this._resolveName(expr.name, `Variable '${expr.name.lexeme}' no definida`);
                break;
            case 'Assign':
                this._resolveExpr(expr.value);
                this._resolveName(expr.name, `Variable '${expr.name.lexeme}' no definida`);
                break;
            case 'Call':
                this._resolveExpr(expr.callee);
                for (const argument of expr.args) {
                    this._resolveExpr(argument);
                }
                break;
            case 'Unary':
                this._resolveExpr(expr.right);
                break;
            case 'Binary':
                this._resolveExpr(expr.left);
                this._resolveExpr(expr.right);
                break;
            case 'Grouping':
                this._resolveExpr(expr.expression);
                break;
        }
    }
    _resolveName(token, undefinedMessage) {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            const scope = this.scopes[i];
            if (!scope.has(token.lexeme)) {
                continue;
            }
            if (scope.get(token.lexeme) === false) {
                this._error(token, `No se puede leer '${token.lexeme}' en su propio inicializador`);
            }
            return;
        }
        this._error(token, undefinedMessage);
    }
    _declare(token, duplicateMessage) {
        const scope = this._currentScope();
        if (scope.has(token.lexeme) && this.scopes.length > 1) {
            this._error(token, duplicateMessage);
        }
        scope.set(token.lexeme, false);
    }
    _define(token) {
        this._currentScope().set(token.lexeme, true);
    }
    _beginScope() {
        this.scopes.push(new Map());
    }
    _endScope() {
        this.scopes.pop();
    }
    _currentScope() {
        const scope = this.scopes[this.scopes.length - 1];
        if (scope === undefined) {
            throw new Error('Semantic resolver scope stack is empty');
        }
        return scope;
    }
    _error(token, message) {
        this.diagnostics.push({ token, message });
    }
}
exports.SemanticResolver = SemanticResolver;
//# sourceMappingURL=semantic-resolver.js.map