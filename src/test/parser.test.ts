import * as assert from 'assert';
import { Parser } from '../parser';
import { Scanner } from '../scanner';
import { Literal, Variable, Grouping, Assign } from '../ast';

function parse(source: string) {
	const tokens = new Scanner(source).scan();
	return new Parser(tokens);
}

function primary(source: string) {
	return (parse(source) as any)['_primary']();
}

suite('Parser - primary', () => {

	// ─── literales ─────────────────────────────────────────────────────────────

	suite('literales', () => {
		test('false', () => {
			const node = primary('false') as Literal;
			assert.strictEqual(node.kind, 'Literal');
			assert.strictEqual(node.value, false);
		});

		test('true', () => {
			const node = primary('true') as Literal;
			assert.strictEqual(node.kind, 'Literal');
			assert.strictEqual(node.value, true);
		});

		test('nil', () => {
			const node = primary('nil') as Literal;
			assert.strictEqual(node.kind, 'Literal');
			assert.strictEqual(node.value, null);
		});

		test('número entero', () => {
			const node = primary('42') as Literal;
			assert.strictEqual(node.kind, 'Literal');
			assert.strictEqual(node.value, 42);
		});

		test('número decimal', () => {
			const node = primary('3.14') as Literal;
			assert.strictEqual(node.value, 3.14);
		});

		test('string', () => {
			const node = primary('"hola"') as Literal;
			assert.strictEqual(node.kind, 'Literal');
			assert.strictEqual(node.value, 'hola');
		});

		test('string vacío', () => {
			const node = primary('""') as Literal;
			assert.strictEqual(node.value, '');
		});
	});

	// ─── identificadores ───────────────────────────────────────────────────────

	suite('identificadores', () => {
		test('variable simple', () => {
			const node = primary('x') as Variable;
			assert.strictEqual(node.kind, 'Variable');
			assert.strictEqual(node.name.lexeme, 'x');
		});

		test('variable con underscore', () => {
			const node = primary('_privado') as Variable;
			assert.strictEqual(node.kind, 'Variable');
			assert.strictEqual(node.name.lexeme, '_privado');
		});

		test('variable con números', () => {
			const node = primary('x1') as Variable;
			assert.strictEqual(node.name.lexeme, 'x1');
		});
	});

	// ─── grouping ──────────────────────────────────────────────────────────────

	suite('grouping', () => {
		test('literal entre paréntesis', () => {
			const node = primary('(42)') as Grouping;
			assert.strictEqual(node.kind, 'Grouping');
			assert.strictEqual((node.expression as Literal).value, 42);
		});

		test('identificador entre paréntesis', () => {
			const node = primary('(x)') as Grouping;
			assert.strictEqual(node.kind, 'Grouping');
			assert.strictEqual((node.expression as Variable).name.lexeme, 'x');
		});

		test('paréntesis sin cerrar lanza error', () => {
			assert.throws(() => primary('(42'));
		});
	});

	// ─── errores ───────────────────────────────────────────────────────────────

	suite('errores', () => {
		test('token inválido como expresión lanza error', () => {
			assert.throws(() => primary('+'));
		});

		test('EOF lanza error', () => {
			assert.throws(() => primary(''));
		});
	});

});

import { Unary } from '../ast';

function unary(source: string) {
	return (parse(source) as any)['_unary']();
}

suite('Parser - unary', () => {

	test('negación lógica', () => {
		const node = unary('!true') as Unary;
		assert.strictEqual(node.kind, 'Unary');
		assert.strictEqual(node.operator.lexeme, '!');
		assert.strictEqual((node.right as Literal).value, true);
	});

	test('negación numérica', () => {
		const node = unary('-42') as Unary;
		assert.strictEqual(node.kind, 'Unary');
		assert.strictEqual(node.operator.lexeme, '-');
		assert.strictEqual((node.right as Literal).value, 42);
	});

	test('doble negación lógica', () => {
		const node = unary('!!true') as Unary;
		assert.strictEqual(node.kind, 'Unary');
		assert.strictEqual((node.right as Unary).kind, 'Unary');
	});

	test('doble negación numérica', () => {
		const node = unary('--1') as Unary;
		assert.strictEqual(node.kind, 'Unary');
		assert.strictEqual((node.right as Unary).kind, 'Unary');
	});

	test('sin operador unario cae a primary', () => {
		const node = unary('42') as Literal;
		assert.strictEqual(node.kind, 'Literal');
		assert.strictEqual(node.value, 42);
	});

	test('negación de identificador', () => {
		const node = unary('!x') as Unary;
		assert.strictEqual(node.kind, 'Unary');
		assert.strictEqual((node.right as Variable).name.lexeme, 'x');
	});

});

// src/test/parser.test.ts — agregás estos suites al final

import { Binary } from '../ast';

function expression(source: string) {
	return (parse(source) as any)['_expression']();
}

suite('Parser - binary', () => {

	// ─── factor ────────────────────────────────────────────────────────────────

	suite('factor', () => {
		test('multiplicación', () => {
			const node = expression('2 * 3') as Binary;
			assert.strictEqual(node.kind, 'Binary');
			assert.strictEqual(node.operator.lexeme, '*');
			assert.strictEqual((node.left as Literal).value, 2);
			assert.strictEqual((node.right as Literal).value, 3);
		});

		test('división', () => {
			const node = expression('10 / 2') as Binary;
			assert.strictEqual(node.operator.lexeme, '/');
		});

		test('módulo', () => {
			const node = expression('10 % 3') as Binary;
			assert.strictEqual(node.operator.lexeme, '%');
		});

		test('potencia', () => {
			const node = expression('2 ** 8') as Binary;
			assert.strictEqual(node.operator.lexeme, '**');
		});

		test('encadenado izquierda a derecha', () => {
			const node = expression('2 * 3 * 4') as Binary;
			assert.strictEqual(node.kind, 'Binary');
			assert.strictEqual((node.left as Binary).kind, 'Binary');
		});
	});

	// ─── term ──────────────────────────────────────────────────────────────────

	suite('term', () => {
		test('suma', () => {
			const node = expression('1 + 2') as Binary;
			assert.strictEqual(node.operator.lexeme, '+');
		});

		test('resta', () => {
			const node = expression('5 - 3') as Binary;
			assert.strictEqual(node.operator.lexeme, '-');
		});

		test('suma tiene menor precedencia que multiplicación', () => {
			// 1 + 2 * 3 → Binary(1, +, Binary(2, *, 3))
			const node = expression('1 + 2 * 3') as Binary;
			assert.strictEqual(node.operator.lexeme, '+');
			assert.strictEqual((node.right as Binary).operator.lexeme, '*');
		});

		test('resta tiene menor precedencia que división', () => {
			const node = expression('6 - 10 / 2') as Binary;
			assert.strictEqual(node.operator.lexeme, '-');
			assert.strictEqual((node.right as Binary).operator.lexeme, '/');
		});
	});

	// ─── comparison ────────────────────────────────────────────────────────────

	suite('comparison', () => {
		test('mayor', () => {
			const node = expression('5 > 3') as Binary;
			assert.strictEqual(node.operator.lexeme, '>');
		});

		test('menor', () => {
			const node = expression('3 < 5') as Binary;
			assert.strictEqual(node.operator.lexeme, '<');
		});

		test('mayor o igual', () => {
			const node = expression('5 >= 5') as Binary;
			assert.strictEqual(node.operator.lexeme, '>=');
		});

		test('menor o igual', () => {
			const node = expression('3 <= 4') as Binary;
			assert.strictEqual(node.operator.lexeme, '<=');
		});

		test('comparison tiene menor precedencia que term', () => {
			// 1 + 2 > 3 → Binary(Binary(1, +, 2), >, 3)
			const node = expression('1 + 2 > 3') as Binary;
			assert.strictEqual(node.operator.lexeme, '>');
			assert.strictEqual((node.left as Binary).operator.lexeme, '+');
		});
	});

	// ─── equality ──────────────────────────────────────────────────────────────

	suite('equality', () => {
		test('igual', () => {
			const node = expression('1 == 1') as Binary;
			assert.strictEqual(node.operator.lexeme, '==');
		});

		test('distinto', () => {
			const node = expression('1 != 2') as Binary;
			assert.strictEqual(node.operator.lexeme, '!=');
		});

		test('equality tiene menor precedencia que comparison', () => {
			// 1 < 2 == true → Binary(Binary(1, <, 2), ==, true)
			const node = expression('1 < 2 == true') as Binary;
			assert.strictEqual(node.operator.lexeme, '==');
			assert.strictEqual((node.left as Binary).operator.lexeme, '<');
		});
	});

	// ─── grouping con expresiones ───────────────────────────────────────────────

	suite('grouping con expresiones', () => {
		test('paréntesis fuerzan precedencia', () => {
			// (1 + 2) * 3 → Binary(Grouping(Binary(1, +, 2)), *, 3)
			const node = expression('(1 + 2) * 3') as Binary;
			assert.strictEqual(node.operator.lexeme, '*');
			assert.strictEqual(node.left.kind, 'Grouping');
		});

		test('expresión compleja', () => {
			const node = expression('(1 + 2) * (3 - 4)') as Binary;
			assert.strictEqual(node.operator.lexeme, '*');
			assert.strictEqual(node.left.kind, 'Grouping');
			assert.strictEqual(node.right.kind, 'Grouping');
		});
	});

	// ─── combinaciones ─────────────────────────────────────────────────────────

	suite('combinaciones', () => {
		test('unario dentro de binario', () => {
			const node = expression('-1 + 2') as Binary;
			assert.strictEqual(node.operator.lexeme, '+');
			assert.strictEqual(node.left.kind, 'Unary');
		});

		test('negación lógica dentro de equality', () => {
			const node = expression('!true == false') as Binary;
			assert.strictEqual(node.operator.lexeme, '==');
			assert.strictEqual(node.left.kind, 'Unary');
		});

		test('expresión con identificadores', () => {
			const node = expression('x + y') as Binary;
			assert.strictEqual(node.operator.lexeme, '+');
			assert.strictEqual(node.left.kind, 'Variable');
			assert.strictEqual(node.right.kind, 'Variable');
		});
	});

});

suite('Parser - assignment', () => {

	test('asignación simple', () => {
		const node = expression('x = 1') as Assign;
		assert.strictEqual(node.kind, 'Assign');
		assert.strictEqual(node.name.lexeme, 'x');
		assert.strictEqual((node.value as Literal).value, 1);
	});

	test('asociativo por la derecha', () => {
		const node = expression('a = b = 1') as Assign;
		assert.strictEqual(node.kind, 'Assign');
		assert.strictEqual(node.name.lexeme, 'a');
		assert.strictEqual(node.value.kind, 'Assign');
		assert.strictEqual((node.value as Assign).name.lexeme, 'b');
	});

	test('asignación a no-variable lanza error', () => {
		assert.throws(() => expression('1 = 2'));
	});

	test('asignación con expresión en el valor', () => {
		const node = expression('x = 1 + 2') as Assign;
		assert.strictEqual(node.kind, 'Assign');
		assert.strictEqual(node.value.kind, 'Binary');
	});

	test('sin asignación cae a equality', () => {
		const node = expression('1 + 2') as Binary;
		assert.strictEqual(node.kind, 'Binary');
	});

});