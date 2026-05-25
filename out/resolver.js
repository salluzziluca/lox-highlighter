"use strict";
// src/resolver.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resolver = void 0;
class Resolver {
    semanticMap = new Map();
    resolve(statements) {
        for (const stmt of statements) {
            this._resolveStmt(stmt);
        }
        return this.semanticMap;
    }
    _mark(token, type) {
        this.semanticMap.set(`${token.line}:${token.column}`, type);
    }
    _resolveStmt(stmt) {
        switch (stmt.kind) {
            case 'VarDecl':
                this._mark(stmt.name, 'variable');
                if (stmt.initializer !== null) {
                    this._resolveExpr(stmt.initializer);
                }
                break;
            case 'FunDecl':
                this._mark(stmt.name, 'function');
                for (const param of stmt.params) {
                    this._mark(param, 'parameter');
                }
                for (const s of stmt.body) {
                    this._resolveStmt(s);
                }
                break;
            case 'Block':
                for (const s of stmt.statements) {
                    this._resolveStmt(s);
                }
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
                if (stmt.value !== null) {
                    this._resolveExpr(stmt.value);
                }
                break;
        }
    }
    _resolveExpr(expr) {
        switch (expr.kind) {
            case 'Literal':
                break;
            case 'Variable':
                this._mark(expr.name, 'variable');
                break;
            case 'Assign':
                this._mark(expr.name, 'variable');
                this._resolveExpr(expr.value);
                break;
            case 'Call':
                this._resolveExpr(expr.callee);
                for (const arg of expr.args) {
                    this._resolveExpr(arg);
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
}
exports.Resolver = Resolver;
//# sourceMappingURL=resolver.js.map