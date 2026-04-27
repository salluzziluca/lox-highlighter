// src/test/scanner.test.ts
import * as assert from 'assert';
import { Scanner } from '../scanner';
import { TokenType } from '../tokens';

suite('Scanner', () => {

	// ─── helpers ───────────────────────────────────────────────────────────────

	function scan(source: string) {
		return new Scanner(source).scan().filter(t => t.tokenType !== TokenType.EOF);
	}

	function types(source: string): TokenType[] {
		return scan(source).map(t => t.tokenType);
	}

	// ─── tokens de un solo carácter ────────────────────────────────────────────

	suite('tokens de un solo carácter', () => {
		test('LEFT_PAREN', () => assert.deepStrictEqual(types('('), [TokenType.LEFT_PAREN]));
		test('RIGHT_PAREN', () => assert.deepStrictEqual(types(')'), [TokenType.RIGHT_PAREN]));
		test('LEFT_BRACE', () => assert.deepStrictEqual(types('{'), [TokenType.LEFT_BRACE]));
		test('RIGHT_BRACE', () => assert.deepStrictEqual(types('}'), [TokenType.RIGHT_BRACE]));
		test('COMMA', () => assert.deepStrictEqual(types(','), [TokenType.COMMA]));
		test('MINUS', () => assert.deepStrictEqual(types('-'), [TokenType.MINUS]));
		test('SEMICOLON', () => assert.deepStrictEqual(types(';'), [TokenType.SEMICOLON]));
		test('STAR', () => assert.deepStrictEqual(types('*'), [TokenType.STAR]));
		test('PERCENT', () => assert.deepStrictEqual(types('%'), [TokenType.PERCENT]));
		test('SLASH', () => assert.deepStrictEqual(types('/'), [TokenType.SLASH]));
		test('QUESTION', () => assert.deepStrictEqual(types('?'), [TokenType.QUESTION]));
		test('COLON', () => assert.deepStrictEqual(types(':'), [TokenType.COLON]));
	});

	// ─── tokens de uno o dos caracteres ────────────────────────────────────────

	suite('tokens de uno o dos caracteres', () => {
		test('PLUS', () => assert.deepStrictEqual(types('+'), [TokenType.PLUS]));
		test('PLUS_PLUS', () => assert.deepStrictEqual(types('++'), [TokenType.PLUS_PLUS]));
		test('BANG', () => assert.deepStrictEqual(types('!'), [TokenType.BANG]));
		test('BANG_EQUAL', () => assert.deepStrictEqual(types('!='), [TokenType.BANG_EQUAL]));
		test('EQUAL', () => assert.deepStrictEqual(types('='), [TokenType.EQUAL]));
		test('EQUAL_EQUAL', () => assert.deepStrictEqual(types('=='), [TokenType.EQUAL_EQUAL]));
		test('GREATER', () => assert.deepStrictEqual(types('>'), [TokenType.GREATER]));
		test('GREATER_EQUAL', () => assert.deepStrictEqual(types('>='), [TokenType.GREATER_EQUAL]));
		test('LESS', () => assert.deepStrictEqual(types('<'), [TokenType.LESS]));
		test('LESS_EQUAL', () => assert.deepStrictEqual(types('<='), [TokenType.LESS_EQUAL]));
		test('STAR_STAR', () => assert.deepStrictEqual(types('**'), [TokenType.STAR_STAR]));
	});

	// ─── comentarios ───────────────────────────────────────────────────────────

	suite('comentarios', () => {
		test('comentario descarta el resto de la línea', () => {
			assert.deepStrictEqual(types('// esto es un comentario'), []);
		});

		test('comentario no afecta la línea siguiente', () => {
			assert.deepStrictEqual(types('// comentario\nvar'), [TokenType.VAR]);
		});

		test('slash solo no es comentario', () => {
			assert.deepStrictEqual(types('/'), [TokenType.SLASH]);
		});

		test('comentario al final sin newline', () => {
			assert.doesNotThrow(() => scan('var x = 1; // comentario final'));
		});
	});

	// ─── whitespace ────────────────────────────────────────────────────────────

	suite('whitespace', () => {
		test('espacios son ignorados', () => {
			assert.deepStrictEqual(types('   '), []);
		});

		test('tabs son ignorados', () => {
			assert.deepStrictEqual(types('\t\t'), []);
		});

		test('carriage return es ignorado', () => {
			assert.deepStrictEqual(types('\r'), []);
		});

		test('newline es ignorado como token', () => {
			assert.deepStrictEqual(types('\n'), []);
		});
	});

	// ─── números ───────────────────────────────────────────────────────────────

	suite('números', () => {
		test('entero', () => {
			const tokens = scan('42');
			assert.strictEqual(tokens[0].tokenType, TokenType.NUMBER);
			assert.strictEqual(tokens[0].literal, 42);
		});

		test('decimal', () => {
			const tokens = scan('3.14');
			assert.strictEqual(tokens[0].tokenType, TokenType.NUMBER);
			assert.strictEqual(tokens[0].literal, 3.14);
		});

		test('cero', () => {
			const tokens = scan('0');
			assert.strictEqual(tokens[0].literal, 0);
		});

		test('número grande', () => {
			const tokens = scan('999999');
			assert.strictEqual(tokens[0].literal, 999999);
		});

		test('punto sin dígito después no es decimal', () => {
			const tokens = scan('1.');
			assert.strictEqual(tokens[0].tokenType, TokenType.NUMBER);
			assert.strictEqual(tokens[0].literal, 1);
		});

		test('lexeme correcto', () => {
			const tokens = scan('123');
			assert.strictEqual(tokens[0].lexeme, '123');
		});
	});

	// ─── strings ───────────────────────────────────────────────────────────────

	suite('strings', () => {
		test('string simple', () => {
			const tokens = scan('"hola"');
			assert.strictEqual(tokens[0].tokenType, TokenType.STRING);
			assert.strictEqual(tokens[0].literal, 'hola');
		});

		test('string vacío', () => {
			const tokens = scan('""');
			assert.strictEqual(tokens[0].tokenType, TokenType.STRING);
			assert.strictEqual(tokens[0].literal, '');
		});

		test('string con espacios', () => {
			const tokens = scan('"hola mundo"');
			assert.strictEqual(tokens[0].literal, 'hola mundo');
		});

		test('string con números', () => {
			const tokens = scan('"abc123"');
			assert.strictEqual(tokens[0].literal, 'abc123');
		});

		test('string multilínea no explota', () => {
			assert.doesNotThrow(() => scan('"hola\nmundo"'));
		});

		test('string sin cerrar no explota', () => {
			assert.doesNotThrow(() => scan('"hola'));
		});

		test('string sin cerrar devuelve token STRING igual', () => {
			const tokens = scan('"hola');
			assert.strictEqual(tokens[0].tokenType, TokenType.STRING);
		});
	});

	// ─── keywords ──────────────────────────────────────────────────────────────

	suite('keywords', () => {
		const keywords: [string, TokenType][] = [
			['and', TokenType.AND],
			['else', TokenType.ELSE],
			['false', TokenType.FALSE],
			['fun', TokenType.FUN],
			['for', TokenType.FOR],
			['if', TokenType.IF],
			['nil', TokenType.NIL],
			['or', TokenType.OR],
			['print', TokenType.PRINT],
			['return', TokenType.RETURN],
			['true', TokenType.TRUE],
			['var', TokenType.VAR],
			['while', TokenType.WHILE],
		];

		for (const [word, expected] of keywords) {
			test(word, () => assert.deepStrictEqual(types(word), [expected]));
		}

		test('true tiene literal true', () => {
			assert.strictEqual(scan('true')[0].literal, true);
		});

		test('false tiene literal false', () => {
			assert.strictEqual(scan('false')[0].literal, false);
		});

		test('nil tiene literal null', () => {
			assert.strictEqual(scan('nil')[0].literal, null);
		});

		test('keyword como prefijo de identificador no matchea', () => {
			assert.deepStrictEqual(types('iffy'), [TokenType.IDENTIFIER]);
		});

		test('keyword como sufijo de identificador no matchea', () => {
			assert.deepStrictEqual(types('myif'), [TokenType.IDENTIFIER]);
		});
	});

	// ─── identificadores ───────────────────────────────────────────────────────

	suite('identificadores', () => {
		test('identificador simple', () => {
			assert.deepStrictEqual(types('pepito'), [TokenType.IDENTIFIER]);
		});

		test('identificador con números', () => {
			assert.deepStrictEqual(types('x1'), [TokenType.IDENTIFIER]);
		});

		test('identificador con underscore', () => {
			assert.deepStrictEqual(types('_privado'), [TokenType.IDENTIFIER]);
		});

		test('identificador no puede arrancar con número', () => {
			const tokens = scan('1x');
			assert.strictEqual(tokens[0].tokenType, TokenType.NUMBER);
			assert.strictEqual(tokens[1].tokenType, TokenType.IDENTIFIER);
		});

		test('lexeme correcto', () => {
			assert.strictEqual(scan('pepito')[0].lexeme, 'pepito');
		});
	});

	// ─── posiciones ────────────────────────────────────────────────────────────

	suite('posiciones', () => {
		test('primer token arranca en línea 1 columna 1', () => {
			const token = scan('var')[0];
			assert.strictEqual(token.line, 1);
			assert.strictEqual(token.column, 1);
		});

		test('columna de segundo token en la misma línea', () => {
			const tokens = scan('var x');
			assert.strictEqual(tokens[1].column, 5);
		});

		test('línea incrementa con newline', () => {
			const tokens = scan('var\nx');
			assert.strictEqual(tokens[1].line, 2);
		});

		test('columna resetea después de newline', () => {
			const tokens = scan('var\nx');
			assert.strictEqual(tokens[1].column, 1);
		});

		test('posición correcta con múltiples líneas', () => {
			const tokens = scan('var x = 1;\nvar y = 2;');
			const y = tokens.find(t => t.lexeme === 'y')!;
			assert.strictEqual(y.line, 2);
			assert.strictEqual(y.column, 5);
		});
	});

	// ─── expresiones completas ─────────────────────────────────────────────────

	suite('expresiones completas', () => {
		test('declaración de variable', () => {
			assert.deepStrictEqual(
				types('var x = 1;'),
				[TokenType.VAR, TokenType.IDENTIFIER, TokenType.EQUAL, TokenType.NUMBER, TokenType.SEMICOLON]
			);
		});

		test('if else', () => {
			assert.deepStrictEqual(
				types('if (x) { } else { }'),
				[
					TokenType.IF, TokenType.LEFT_PAREN, TokenType.IDENTIFIER, TokenType.RIGHT_PAREN,
					TokenType.LEFT_BRACE, TokenType.RIGHT_BRACE,
					TokenType.ELSE,
					TokenType.LEFT_BRACE, TokenType.RIGHT_BRACE,
				]
			);
		});

		test('llamada a función', () => {
			assert.deepStrictEqual(
				types('print(x);'),
				[TokenType.PRINT, TokenType.LEFT_PAREN, TokenType.IDENTIFIER, TokenType.RIGHT_PAREN, TokenType.SEMICOLON]
			);
		});

		test('operación aritmética', () => {
			assert.deepStrictEqual(
				types('1 + 2 * 3'),
				[TokenType.NUMBER, TokenType.PLUS, TokenType.NUMBER, TokenType.STAR, TokenType.NUMBER]
			);
		});
	});

	// ─── edge cases ────────────────────────────────────────────────────────────

	suite('edge cases', () => {
		test('string vacío como input', () => {
			assert.deepStrictEqual(scan(''), []);
		});

		test('solo whitespace', () => {
			assert.deepStrictEqual(scan('   \t\n  '), []);
		});

		test('solo comentarios', () => {
			assert.deepStrictEqual(scan('// todo comentario\n// otra línea'), []);
		});

		test('carácter desconocido no explota', () => {
			assert.doesNotThrow(() => scan('@'));
		});

		test('carácter desconocido no explota 2', () => {
			assert.doesNotThrow(() => scan('$'));
		});

		test('archivo sin newline al final', () => {
			assert.doesNotThrow(() => scan('var x = 1'));
		});

		test('múltiples tokens seguidos sin espacios', () => {
			assert.deepStrictEqual(
				types('(())'),
				[TokenType.LEFT_PAREN, TokenType.LEFT_PAREN, TokenType.RIGHT_PAREN, TokenType.RIGHT_PAREN]
			);
		});
	});

});