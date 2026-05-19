import { Expr, FunDecl, Stmt } from './ast';
import { Token } from './tokens';

export interface UsageDiagnostic {
	start: Token;
	end: Token;
	message: string;
	kind: 'unreachable' | 'unused';
}

type SymbolKind = 'variable' | 'function' | 'parameter';

interface SymbolInfo {
	token: Token;
	used: boolean;
	kind: SymbolKind;
}

type Scope = Map<string, SymbolInfo>;

export class UsageResolver {
	private diagnostics: UsageDiagnostic[] = [];
	private scopes: Scope[] = [];

	resolve(statements: Stmt[]): UsageDiagnostic[] {
		this.diagnostics = [];
		this.scopes = [];

		this._beginScope();
		this._resolveBlock(statements);
		this._endScope();

		return this.diagnostics;
	}

	private _resolveBlock(statements: Stmt[]): boolean {
		let reachable = true;
		for (const stmt of statements) {
			if (!reachable) {
				this._markUnreachable(stmt);
				continue;
			}

			const continues = this._resolveStmt(stmt);
			if (!continues) {
				reachable = false;
			}
		}

		return reachable;
	}

	private _resolveStmt(stmt: Stmt): boolean {
		switch (stmt.kind) {
			case 'VarDecl':
				this._declare(stmt.name, 'variable');
				if (stmt.initializer !== null) {
					this._resolveExpr(stmt.initializer);
				}
				return true;

			case 'FunDecl':
				this._declare(stmt.name, 'function');
				this._resolveFunction(stmt);
				return true;

			case 'Block':
				this._beginScope();
				this._resolveBlock(stmt.statements);
				this._endScope();
				return true;

			case 'ExpressionStmt':
				this._resolveExpr(stmt.expression);
				return true;

			case 'PrintStmt':
				this._resolveExpr(stmt.expression);
				return true;

			case 'IfStmt': {
				this._resolveExpr(stmt.condition);
				const thenContinues = this._resolveStmt(stmt.thenBranch);
				const elseContinues = stmt.elseBranch ? this._resolveStmt(stmt.elseBranch) : true;
				return thenContinues || elseContinues;
			}

			case 'WhileStmt':
				this._resolveExpr(stmt.condition);
				this._resolveStmt(stmt.body);
				return true;

			case 'ReturnStmt':
				if (stmt.value !== null) {
					this._resolveExpr(stmt.value);
				}
				return false;
		}
	}

	private _resolveFunction(functionDeclaration: FunDecl): void {
		this._beginScope();
		for (const param of functionDeclaration.params) {
			this._declare(param, 'parameter');
		}
		this._resolveBlock(functionDeclaration.body);
		this._endScope();
	}

	private _resolveExpr(expr: Expr): void {
		switch (expr.kind) {
			case 'Literal':
				return;

			case 'Variable':
				this._use(expr.name);
				return;

			case 'Assign':
				this._use(expr.name);
				this._resolveExpr(expr.value);
				return;

			case 'Call':
				this._resolveExpr(expr.callee);
				for (const argument of expr.args) {
					this._resolveExpr(argument);
				}
				return;

			case 'Unary':
				this._resolveExpr(expr.right);
				return;

			case 'Binary':
				this._resolveExpr(expr.left);
				this._resolveExpr(expr.right);
				return;

			case 'Grouping':
				this._resolveExpr(expr.expression);
				return;
		}
	}

	private _declare(token: Token, kind: SymbolKind): void {
		this._currentScope().set(token.lexeme, { token, used: false, kind });
	}

	private _use(token: Token): void {
		for (let i = this.scopes.length - 1; i >= 0; i--) {
			const scope = this.scopes[i];
			const symbol = scope.get(token.lexeme);
			if (symbol) {
				symbol.used = true;
				return;
			}
		}
	}

	private _markUnreachable(stmt: Stmt): void {
		const range = this._rangeFromTokens(this._collectStmtTokens(stmt));
		if (!range) {
			return;
		}

		this.diagnostics.push({
			start: range.start,
			end: range.end,
			message: 'Codigo inaccesible',
			kind: 'unreachable'
		});
	}

	private _collectStmtTokens(stmt: Stmt): Token[] {
		switch (stmt.kind) {
			case 'VarDecl':
				return [stmt.name, ...this._collectExprTokensOptional(stmt.initializer)];
			case 'FunDecl':
				return [stmt.name, ...stmt.params, ...this._collectBlockTokens(stmt.body)];
			case 'Block':
				return this._collectBlockTokens(stmt.statements);
			case 'ExpressionStmt':
				return this._collectExprTokens(stmt.expression);
			case 'PrintStmt':
				return this._collectExprTokens(stmt.expression);
			case 'IfStmt':
				return [
					...this._collectExprTokens(stmt.condition),
					...this._collectStmtTokens(stmt.thenBranch),
					...(stmt.elseBranch ? this._collectStmtTokens(stmt.elseBranch) : [])
				];
			case 'WhileStmt':
				return [
					...this._collectExprTokens(stmt.condition),
					...this._collectStmtTokens(stmt.body)
				];
			case 'ReturnStmt':
				return [stmt.keyword, ...this._collectExprTokensOptional(stmt.value)];
		}
	}

	private _collectBlockTokens(statements: Stmt[]): Token[] {
		const tokens: Token[] = [];
		for (const stmt of statements) {
			tokens.push(...this._collectStmtTokens(stmt));
		}
		return tokens;
	}

	private _collectExprTokensOptional(expr: Expr | null): Token[] {
		return expr ? this._collectExprTokens(expr) : [];
	}

	private _collectExprTokens(expr: Expr): Token[] {
		switch (expr.kind) {
			case 'Literal':
				return [];
			case 'Variable':
				return [expr.name];
			case 'Assign':
				return [expr.name, ...this._collectExprTokens(expr.value)];
			case 'Call':
				return [
					...this._collectExprTokens(expr.callee),
					...expr.args.flatMap(arg => this._collectExprTokens(arg))
				];
			case 'Unary':
				return [expr.operator, ...this._collectExprTokens(expr.right)];
			case 'Binary':
				return [
					...this._collectExprTokens(expr.left),
					expr.operator,
					...this._collectExprTokens(expr.right)
				];
			case 'Grouping':
				return this._collectExprTokens(expr.expression);
		}
	}

	private _rangeFromTokens(tokens: Token[]): { start: Token; end: Token } | null {
		if (tokens.length === 0) {
			return null;
		}

		const sorted = [...tokens].sort((a, b) => {
			if (a.line !== b.line) {
				return a.line - b.line;
			}
			return a.column - b.column;
		});

		return { start: sorted[0], end: sorted[sorted.length - 1] };
	}

	private _beginScope(): void {
		this.scopes.push(new Map());
	}

	private _endScope(): void {
		const scope = this.scopes.pop();
		if (!scope) {
			return;
		}

		for (const symbol of scope.values()) {
			if (symbol.used) {
				continue;
			}

			this.diagnostics.push({
				start: symbol.token,
				end: symbol.token,
				message: this._unusedMessage(symbol),
				kind: 'unused'
			});
		}
	}

	private _unusedMessage(symbol: SymbolInfo): string {
		switch (symbol.kind) {
			case 'function':
				return `La funcion '${symbol.token.lexeme}' nunca se usa`;
			case 'parameter':
				return `El parametro '${symbol.token.lexeme}' nunca se usa`;
			case 'variable':
				return `La variable '${symbol.token.lexeme}' nunca se usa`;
		}
	}

	private _currentScope(): Scope {
		const scope = this.scopes[this.scopes.length - 1];
		if (!scope) {
			throw new Error('Usage resolver scope stack is empty');
		}
		return scope;
	}
}
