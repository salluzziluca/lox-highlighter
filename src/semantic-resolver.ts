import { Expr, FunDecl, Stmt } from './ast';
import { Token } from './tokens';

export interface ResolverDiagnostic {
	token: Token;
	message: string;
}

type Scope = Map<string, boolean>;

enum FunctionType {
	NONE,
	FUNCTION,
}

export class SemanticResolver {
	private diagnostics: ResolverDiagnostic[] = [];
	private scopes: Scope[] = [];
	private currentFunction: FunctionType = FunctionType.NONE;

	resolve(statements: Stmt[]): ResolverDiagnostic[] {
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

	private _resolveStmt(stmt: Stmt): void {
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

	private _resolveFunction(functionDeclaration: FunDecl): void {
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

	private _resolveExpr(expr: Expr): void {
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

	private _resolveName(token: Token, undefinedMessage: string): void {
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

	private _declare(token: Token, duplicateMessage: string): void {
		const scope = this._currentScope();
		if (scope.has(token.lexeme)) {
			this._error(token, duplicateMessage);
		}
		scope.set(token.lexeme, false);
	}

	private _define(token: Token): void {
		this._currentScope().set(token.lexeme, true);
	}

	private _beginScope(): void {
		this.scopes.push(new Map());
	}

	private _endScope(): void {
		this.scopes.pop();
	}

	private _currentScope(): Scope {
		const scope = this.scopes[this.scopes.length - 1];
		if (scope === undefined) {
			throw new Error('Semantic resolver scope stack is empty');
		}
		return scope;
	}

	private _error(token: Token, message: string): void {
		this.diagnostics.push({ token, message });
	}
}
