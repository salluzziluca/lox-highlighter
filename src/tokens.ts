export enum TokenType {
	// tokens de un solo carácter
	LEFT_PAREN,
	RIGHT_PAREN,
	LEFT_BRACE,
	RIGHT_BRACE,
	COMMA,
	MINUS,
	SEMICOLON,
	STAR,
	PERCENT,
	// el / puede ser token de un solo carácter o comienzo de comentario (//)
	// en ese caso debe ser descartado por el scanner
	SLASH,
	// tokens de uno o dos caracteres
	PLUS,
	PLUS_PLUS,
	BANG,
	BANG_EQUAL,
	EQUAL,
	EQUAL_EQUAL,
	GREATER,
	GREATER_EQUAL,
	LESS,
	LESS_EQUAL,
	QUESTION,
	COLON,
	STAR_STAR,
	// literales
	IDENTIFIER,
	STRING,
	NUMBER,
	// palabras clave
	AND,
	ELSE,
	FALSE,
	FUN,
	FOR,
	IF,
	NIL,
	OR,
	PRINT,
	RETURN,
	TRUE,
	VAR,
	WHILE,
	COMMENT,
	// fin de archivo
	EOF,
}

export type TokenLiteralType = number | string | boolean | null;

export interface Token {
	tokenType: TokenType;
	lexeme: string;
	literal: TokenLiteralType;
	line: number;
	column: number; // agregado respecto al original — VSCode lo necesita para saber dónde pintar
}

export function tokenToString(token: Token): string {
	if (token.tokenType === TokenType.IDENTIFIER) {
		return `${TokenType[token.tokenType]}<${token.lexeme}>`;
	}
	return token.literal === null
		? TokenType[token.tokenType]
		: `${TokenType[token.tokenType]}<${token.literal}>`;
}

export const TokenKeywords: Record<string, TokenType> = {
	'and': TokenType.AND,
	'else': TokenType.ELSE,
	'false': TokenType.FALSE,
	'fun': TokenType.FUN,
	'for': TokenType.FOR,
	'if': TokenType.IF,
	'nil': TokenType.NIL,
	'or': TokenType.OR,
	'print': TokenType.PRINT,
	'return': TokenType.RETURN,
	'true': TokenType.TRUE,
	'var': TokenType.VAR,
	'while': TokenType.WHILE,
};