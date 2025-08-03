export type Stmt = FnStmt | RetStmt | LetStmt | ExprStmt;

export type Expr = CallExpr | BinOpExpr | IdentExpr | LitExpr;

export interface FnStmt {
	type: "function";
	name: string;
	params: string[];
	body: Stmt[];
}

export interface RetStmt {
	type: "return";
	expr: Expr;
}

export interface LetStmt {
	type: "let";
	name: string;
	expr: Expr;
}

export interface ExprStmt {
	type: "expr";
	expr: Expr;
}

export interface CallExpr {
	type: "call";
	callee: string;
	args: Expr[];
}

export interface BinOpExpr {
	type: "binary";
	operator: string;
	left: Expr;
	right: Expr;
}

export interface IdentExpr {
	type: "identifier";
	name: string;
}

export interface LitExpr {
	type: "literal";
	value: number;
}

export interface Program {
	type: "program";
	body: Stmt[];
}
