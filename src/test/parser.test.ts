import * as assert from 'assert';
import { Parser } from '../parser';
import { Scanner } from '../scanner';
import { Literal, Variable, Grouping } from '../ast';

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