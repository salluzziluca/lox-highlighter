"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenKeywords = exports.TokenType = void 0;
exports.tokenToString = tokenToString;
var TokenType;
(function (TokenType) {
    // tokens de un solo carácter
    TokenType[TokenType["LEFT_PAREN"] = 0] = "LEFT_PAREN";
    TokenType[TokenType["RIGHT_PAREN"] = 1] = "RIGHT_PAREN";
    TokenType[TokenType["LEFT_BRACE"] = 2] = "LEFT_BRACE";
    TokenType[TokenType["RIGHT_BRACE"] = 3] = "RIGHT_BRACE";
    TokenType[TokenType["COMMA"] = 4] = "COMMA";
    TokenType[TokenType["MINUS"] = 5] = "MINUS";
    TokenType[TokenType["SEMICOLON"] = 6] = "SEMICOLON";
    TokenType[TokenType["STAR"] = 7] = "STAR";
    TokenType[TokenType["PERCENT"] = 8] = "PERCENT";
    // el / puede ser token de un solo carácter o comienzo de comentario (//)
    // en ese caso debe ser descartado por el scanner
    TokenType[TokenType["SLASH"] = 9] = "SLASH";
    // tokens de uno o dos caracteres
    TokenType[TokenType["PLUS"] = 10] = "PLUS";
    TokenType[TokenType["PLUS_PLUS"] = 11] = "PLUS_PLUS";
    TokenType[TokenType["BANG"] = 12] = "BANG";
    TokenType[TokenType["BANG_EQUAL"] = 13] = "BANG_EQUAL";
    TokenType[TokenType["EQUAL"] = 14] = "EQUAL";
    TokenType[TokenType["EQUAL_EQUAL"] = 15] = "EQUAL_EQUAL";
    TokenType[TokenType["GREATER"] = 16] = "GREATER";
    TokenType[TokenType["GREATER_EQUAL"] = 17] = "GREATER_EQUAL";
    TokenType[TokenType["LESS"] = 18] = "LESS";
    TokenType[TokenType["LESS_EQUAL"] = 19] = "LESS_EQUAL";
    TokenType[TokenType["QUESTION"] = 20] = "QUESTION";
    TokenType[TokenType["COLON"] = 21] = "COLON";
    TokenType[TokenType["STAR_STAR"] = 22] = "STAR_STAR";
    // literales
    TokenType[TokenType["IDENTIFIER"] = 23] = "IDENTIFIER";
    TokenType[TokenType["STRING"] = 24] = "STRING";
    TokenType[TokenType["NUMBER"] = 25] = "NUMBER";
    // palabras clave
    TokenType[TokenType["AND"] = 26] = "AND";
    TokenType[TokenType["ELSE"] = 27] = "ELSE";
    TokenType[TokenType["FALSE"] = 28] = "FALSE";
    TokenType[TokenType["FUN"] = 29] = "FUN";
    TokenType[TokenType["FOR"] = 30] = "FOR";
    TokenType[TokenType["IF"] = 31] = "IF";
    TokenType[TokenType["NIL"] = 32] = "NIL";
    TokenType[TokenType["OR"] = 33] = "OR";
    TokenType[TokenType["PRINT"] = 34] = "PRINT";
    TokenType[TokenType["RETURN"] = 35] = "RETURN";
    TokenType[TokenType["TRUE"] = 36] = "TRUE";
    TokenType[TokenType["VAR"] = 37] = "VAR";
    TokenType[TokenType["WHILE"] = 38] = "WHILE";
    TokenType[TokenType["COMMENT"] = 39] = "COMMENT";
    // fin de archivo
    TokenType[TokenType["EOF"] = 40] = "EOF";
})(TokenType || (exports.TokenType = TokenType = {}));
function tokenToString(token) {
    if (token.tokenType === TokenType.IDENTIFIER) {
        return `${TokenType[token.tokenType]}<${token.lexeme}>`;
    }
    return token.literal === null
        ? TokenType[token.tokenType]
        : `${TokenType[token.tokenType]}<${token.literal}>`;
}
exports.TokenKeywords = {
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
//# sourceMappingURL=tokens.js.map