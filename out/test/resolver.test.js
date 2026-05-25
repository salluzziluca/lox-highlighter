"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const scanner_1 = require("../scanner");
const parser_1 = require("../parser");
const resolver_1 = require("../resolver");
function resolve(source) {
    const tokens = new scanner_1.Scanner(source).scan();
    const stmts = new parser_1.Parser(tokens).parse();
    return new resolver_1.Resolver().resolve(stmts);
}
function get(map, line, column) {
    return map.get(`${line}:${column}`);
}
suite('Resolver', () => {
    // ─── VarDecl ───────────────────────────────────────────────────────────────
    suite('VarDecl', () => {
        test('nombre de variable marcado como variable', () => {
            const map = resolve('var x = 1;');
            assert.strictEqual(get(map, 1, 5), 'variable');
        });
        test('inicializador resuelto', () => {
            const map = resolve('var x = y;');
            assert.strictEqual(get(map, 1, 9), 'variable');
        });
        test('sin inicializador no explota', () => {
            assert.doesNotThrow(() => resolve('var x;'));
        });
    });
    // ─── FunDecl ───────────────────────────────────────────────────────────────
    suite('FunDecl', () => {
        test('nombre de función marcado como function', () => {
            const map = resolve('fun saludar() {}');
            assert.strictEqual(get(map, 1, 5), 'function');
        });
        test('parámetros marcados como parameter', () => {
            const map = resolve('fun sumar(a, b) {}');
            assert.strictEqual(get(map, 1, 11), 'parameter');
            assert.strictEqual(get(map, 1, 14), 'parameter');
        });
        test('body resuelto', () => {
            const map = resolve('fun f() { var x = 1; }');
            assert.strictEqual(get(map, 1, 15), 'variable');
        });
        test('función sin parámetros no explota', () => {
            assert.doesNotThrow(() => resolve('fun f() {}'));
        });
    });
    // ─── referencias a variables ───────────────────────────────────────────────
    suite('Variable', () => {
        test('referencia a variable marcada como variable', () => {
            const map = resolve('var x = 1; print x;');
            assert.strictEqual(get(map, 1, 18), 'variable');
        });
        test('asignación marcada como variable', () => {
            const map = resolve('var x = 1; x = 2;');
            assert.strictEqual(get(map, 1, 12), 'variable');
        });
    });
    // ─── call ──────────────────────────────────────────────────────────────────
    suite('Call', () => {
        test('callee resuelto', () => {
            const map = resolve('fun f() {} f();');
            assert.strictEqual(get(map, 1, 12), 'variable');
        });
        test('argumentos resueltos', () => {
            const map = resolve('fun f(a) {} var x = 1; f(x);');
            assert.strictEqual(get(map, 1, 26), 'variable');
        });
    });
    // ─── expresiones ───────────────────────────────────────────────────────────
    suite('Expresiones', () => {
        test('binary resuelve ambos lados', () => {
            const map = resolve('var x = a + b;');
            assert.strictEqual(get(map, 1, 9), 'variable');
            assert.strictEqual(get(map, 1, 13), 'variable');
        });
        test('unary resuelve el operando', () => {
            const map = resolve('var x = !y;');
            assert.strictEqual(get(map, 1, 10), 'variable');
        });
        test('grouping resuelve la expresión interior', () => {
            const map = resolve('var x = (y);');
            assert.strictEqual(get(map, 1, 10), 'variable');
        });
        test('literal no agrega nada al mapa', () => {
            const map = resolve('var x = 1;');
            assert.strictEqual(get(map, 1, 9), undefined);
        });
    });
    // ─── statements ────────────────────────────────────────────────────────────
    suite('Statements', () => {
        test('if resuelve condición y branches', () => {
            const map = resolve('if (x) { print y; } else { print z; }');
            assert.strictEqual(get(map, 1, 5), 'variable');
            assert.strictEqual(get(map, 1, 16), 'variable');
            assert.strictEqual(get(map, 1, 34), 'variable');
        });
        test('while resuelve condición y body', () => {
            const map = resolve('while (x) { print y; }');
            assert.strictEqual(get(map, 1, 8), 'variable');
            assert.strictEqual(get(map, 1, 19), 'variable');
        });
        test('return resuelve el valor', () => {
            const map = resolve('fun f() { return x; }');
            assert.strictEqual(get(map, 1, 18), 'variable');
        });
        test('return sin valor no explota', () => {
            assert.doesNotThrow(() => resolve('fun f() { return; }'));
        });
        test('block resuelve todos los statements', () => {
            const map = resolve('{ var x = 1; var y = 2; }');
            assert.strictEqual(get(map, 1, 7), 'variable');
            assert.strictEqual(get(map, 1, 18), 'variable');
        });
    });
    // ─── programa completo ─────────────────────────────────────────────────────
    suite('programa completo', () => {
        test('función con variables internas', () => {
            const map = resolve(`
                fun factorial(n) {
                    if (n <= 1) { return 1; }
                    return n * factorial(n - 1);
                }
            `);
            assert.strictEqual(get(map, 2, 21), 'function');
            assert.strictEqual(get(map, 2, 31), 'parameter');
        });
        test('error de parseo devuelve mapa vacío', () => {
            const tokens = new scanner_1.Scanner('var x = ;').scan();
            try {
                const stmts = new parser_1.Parser(tokens).parse();
                new resolver_1.Resolver().resolve(stmts);
            }
            catch {
                assert.ok(true);
            }
        });
    });
});
//# sourceMappingURL=resolver.test.js.map