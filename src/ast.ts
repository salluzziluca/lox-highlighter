import { Token } from './tokens';

// ─── Expresiones ───────────────────────────────────────────────────────────────

export interface Literal {
	kind: 'Literal';
	value: number | string | boolean | null;
}

export interface Unary {
	kind: 'Unary';
	operator: Token;
	right: Expr;
}

export interface Binary {
	kind: 'Binary';
	left: Expr;
	operator: Token;
	right: Expr;
}

export interface Grouping {
	kind: 'Grouping';
	expression: Expr;
}

export interface Variable {
	kind: 'Variable';
	name: Token;
}

export interface Assign {
	kind: 'Assign';
	name: Token;
	value: Expr;
}

export type Expr =
	| Literal
	| Unary
	| Binary
	| Grouping
	| Variable
	| Assign;

// ─── Statements ────────────────────────────────────────────────────────────────

export interface ExpressionStmt {
	kind: 'ExpressionStmt';
	expression: Expr;
}

export interface PrintStmt {
	kind: 'PrintStmt';
	expression: Expr;
}

export interface VarDecl {
	kind: 'VarDecl';
	name: Token;
	initializer: Expr | null;
}

export interface Block {
	kind: 'Block';
	statements: Stmt[];
}

export interface IfStmt {
	kind: 'IfStmt';
	condition: Expr;
	thenBranch: Stmt;
	elseBranch: Stmt | null;
}

export interface WhileStmt {
	kind: 'WhileStmt';
	condition: Expr;
	body: Stmt;
}

export interface FunDecl {
	kind: 'FunDecl';
	name: Token;
	params: Token[];
	body: Stmt[];
}

export interface ReturnStmt {
	kind: 'ReturnStmt';
	keyword: Token;
	value: Expr | null;
}

export type Stmt =
	| ExpressionStmt
	| PrintStmt
	| VarDecl
	| Block
	| IfStmt
	| WhileStmt
	| FunDecl
	| ReturnStmt;

