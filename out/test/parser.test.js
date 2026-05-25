"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const parser_1 = require("../parser");
const scanner_1 = require("../scanner");
function parse(source) {
    const tokens = new scanner_1.Scanner(source).scan();
    return new parser_1.Parser(tokens);
}
function primary(source) {
    return parse(source)['_primary']();
}
suite('Parser - primary', () => {
    // ─── literales ─────────────────────────────────────────────────────────────
    suite('literales', () => {
        test('false', () => {
            const node = primary('false');
            assert.strictEqual(node.kind, 'Literal');
            assert.strictEqual(node.value, false);
        });
        test('true', () => {
            const node = primary('true');
            assert.strictEqual(node.kind, 'Literal');
            assert.strictEqual(node.value, true);
        });
        test('nil', () => {
            const node = primary('nil');
            assert.strictEqual(node.kind, 'Literal');
            assert.strictEqual(node.value, null);
        });
        test('número entero', () => {
            const node = primary('42');
            assert.strictEqual(node.kind, 'Literal');
            assert.strictEqual(node.value, 42);
        });
        test('número decimal', () => {
            const node = primary('3.14');
            assert.strictEqual(node.value, 3.14);
        });
        test('string', () => {
            const node = primary('"hola"');
            assert.strictEqual(node.kind, 'Literal');
            assert.strictEqual(node.value, 'hola');
        });
        test('string vacío', () => {
            const node = primary('""');
            assert.strictEqual(node.value, '');
        });
    });
    // ─── identificadores ───────────────────────────────────────────────────────
    suite('identificadores', () => {
        test('variable simple', () => {
            const node = primary('x');
            assert.strictEqual(node.kind, 'Variable');
            assert.strictEqual(node.name.lexeme, 'x');
        });
        test('variable con underscore', () => {
            const node = primary('_privado');
            assert.strictEqual(node.kind, 'Variable');
            assert.strictEqual(node.name.lexeme, '_privado');
        });
        test('variable con números', () => {
            const node = primary('x1');
            assert.strictEqual(node.name.lexeme, 'x1');
        });
    });
    // ─── grouping ──────────────────────────────────────────────────────────────
    suite('grouping', () => {
        test('literal entre paréntesis', () => {
            const node = primary('(42)');
            assert.strictEqual(node.kind, 'Grouping');
            assert.strictEqual(node.expression.value, 42);
        });
        test('identificador entre paréntesis', () => {
            const node = primary('(x)');
            assert.strictEqual(node.kind, 'Grouping');
            assert.strictEqual(node.expression.name.lexeme, 'x');
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
function unary(source) {
    return parse(source)['_unary']();
}
suite('Parser - unary', () => {
    test('negación lógica', () => {
        const node = unary('!true');
        assert.strictEqual(node.kind, 'Unary');
        assert.strictEqual(node.operator.lexeme, '!');
        assert.strictEqual(node.right.value, true);
    });
    test('negación numérica', () => {
        const node = unary('-42');
        assert.strictEqual(node.kind, 'Unary');
        assert.strictEqual(node.operator.lexeme, '-');
        assert.strictEqual(node.right.value, 42);
    });
    test('doble negación lógica', () => {
        const node = unary('!!true');
        assert.strictEqual(node.kind, 'Unary');
        assert.strictEqual(node.right.kind, 'Unary');
    });
    test('doble negación numérica', () => {
        const node = unary('--1');
        assert.strictEqual(node.kind, 'Unary');
        assert.strictEqual(node.right.kind, 'Unary');
    });
    test('sin operador unario cae a primary', () => {
        const node = unary('42');
        assert.strictEqual(node.kind, 'Literal');
        assert.strictEqual(node.value, 42);
    });
    test('negación de identificador', () => {
        const node = unary('!x');
        assert.strictEqual(node.kind, 'Unary');
        assert.strictEqual(node.right.name.lexeme, 'x');
    });
});
function expression(source) {
    return parse(source)['_expression']();
}
suite('Parser - binary', () => {
    // ─── factor ────────────────────────────────────────────────────────────────
    suite('factor', () => {
        test('multiplicación', () => {
            const node = expression('2 * 3');
            assert.strictEqual(node.kind, 'Binary');
            assert.strictEqual(node.operator.lexeme, '*');
            assert.strictEqual(node.left.value, 2);
            assert.strictEqual(node.right.value, 3);
        });
        test('división', () => {
            const node = expression('10 / 2');
            assert.strictEqual(node.operator.lexeme, '/');
        });
        test('módulo', () => {
            const node = expression('10 % 3');
            assert.strictEqual(node.operator.lexeme, '%');
        });
        test('potencia', () => {
            const node = expression('2 ** 8');
            assert.strictEqual(node.operator.lexeme, '**');
        });
        test('encadenado izquierda a derecha', () => {
            const node = expression('2 * 3 * 4');
            assert.strictEqual(node.kind, 'Binary');
            assert.strictEqual(node.left.kind, 'Binary');
        });
    });
    // ─── term ──────────────────────────────────────────────────────────────────
    suite('term', () => {
        test('suma', () => {
            const node = expression('1 + 2');
            assert.strictEqual(node.operator.lexeme, '+');
        });
        test('resta', () => {
            const node = expression('5 - 3');
            assert.strictEqual(node.operator.lexeme, '-');
        });
        test('suma tiene menor precedencia que multiplicación', () => {
            // 1 + 2 * 3 → Binary(1, +, Binary(2, *, 3))
            const node = expression('1 + 2 * 3');
            assert.strictEqual(node.operator.lexeme, '+');
            assert.strictEqual(node.right.operator.lexeme, '*');
        });
        test('resta tiene menor precedencia que división', () => {
            const node = expression('6 - 10 / 2');
            assert.strictEqual(node.operator.lexeme, '-');
            assert.strictEqual(node.right.operator.lexeme, '/');
        });
    });
    // ─── comparison ────────────────────────────────────────────────────────────
    suite('comparison', () => {
        test('mayor', () => {
            const node = expression('5 > 3');
            assert.strictEqual(node.operator.lexeme, '>');
        });
        test('menor', () => {
            const node = expression('3 < 5');
            assert.strictEqual(node.operator.lexeme, '<');
        });
        test('mayor o igual', () => {
            const node = expression('5 >= 5');
            assert.strictEqual(node.operator.lexeme, '>=');
        });
        test('menor o igual', () => {
            const node = expression('3 <= 4');
            assert.strictEqual(node.operator.lexeme, '<=');
        });
        test('comparison tiene menor precedencia que term', () => {
            // 1 + 2 > 3 → Binary(Binary(1, +, 2), >, 3)
            const node = expression('1 + 2 > 3');
            assert.strictEqual(node.operator.lexeme, '>');
            assert.strictEqual(node.left.operator.lexeme, '+');
        });
    });
    // ─── equality ──────────────────────────────────────────────────────────────
    suite('equality', () => {
        test('igual', () => {
            const node = expression('1 == 1');
            assert.strictEqual(node.operator.lexeme, '==');
        });
        test('distinto', () => {
            const node = expression('1 != 2');
            assert.strictEqual(node.operator.lexeme, '!=');
        });
        test('equality tiene menor precedencia que comparison', () => {
            // 1 < 2 == true → Binary(Binary(1, <, 2), ==, true)
            const node = expression('1 < 2 == true');
            assert.strictEqual(node.operator.lexeme, '==');
            assert.strictEqual(node.left.operator.lexeme, '<');
        });
    });
    // ─── grouping con expresiones ───────────────────────────────────────────────
    suite('grouping con expresiones', () => {
        test('paréntesis fuerzan precedencia', () => {
            // (1 + 2) * 3 → Binary(Grouping(Binary(1, +, 2)), *, 3)
            const node = expression('(1 + 2) * 3');
            assert.strictEqual(node.operator.lexeme, '*');
            assert.strictEqual(node.left.kind, 'Grouping');
        });
        test('expresión compleja', () => {
            const node = expression('(1 + 2) * (3 - 4)');
            assert.strictEqual(node.operator.lexeme, '*');
            assert.strictEqual(node.left.kind, 'Grouping');
            assert.strictEqual(node.right.kind, 'Grouping');
        });
    });
    // ─── combinaciones ─────────────────────────────────────────────────────────
    suite('combinaciones', () => {
        test('unario dentro de binario', () => {
            const node = expression('-1 + 2');
            assert.strictEqual(node.operator.lexeme, '+');
            assert.strictEqual(node.left.kind, 'Unary');
        });
        test('negación lógica dentro de equality', () => {
            const node = expression('!true == false');
            assert.strictEqual(node.operator.lexeme, '==');
            assert.strictEqual(node.left.kind, 'Unary');
        });
        test('expresión con identificadores', () => {
            const node = expression('x + y');
            assert.strictEqual(node.operator.lexeme, '+');
            assert.strictEqual(node.left.kind, 'Variable');
            assert.strictEqual(node.right.kind, 'Variable');
        });
    });
});
suite('Parser - assignment', () => {
    test('asignación simple', () => {
        const node = expression('x = 1');
        assert.strictEqual(node.kind, 'Assign');
        assert.strictEqual(node.name.lexeme, 'x');
        assert.strictEqual(node.value.value, 1);
    });
    test('asociativo por la derecha', () => {
        const node = expression('a = b = 1');
        assert.strictEqual(node.kind, 'Assign');
        assert.strictEqual(node.name.lexeme, 'a');
        assert.strictEqual(node.value.kind, 'Assign');
        assert.strictEqual(node.value.name.lexeme, 'b');
    });
    test('asignación a no-variable lanza error', () => {
        assert.throws(() => expression('1 = 2'));
    });
    test('asignación con expresión en el valor', () => {
        const node = expression('x = 1 + 2');
        assert.strictEqual(node.kind, 'Assign');
        assert.strictEqual(node.value.kind, 'Binary');
    });
    test('sin asignación cae a equality', () => {
        const node = expression('1 + 2');
        assert.strictEqual(node.kind, 'Binary');
    });
});
function parseProgram(source) {
    const tokens = new scanner_1.Scanner(source).scan();
    return new parser_1.Parser(tokens).parse();
}
suite('Parser - statements', () => {
    // ─── ExpressionStmt ────────────────────────────────────────────────────────
    suite('ExpressionStmt', () => {
        test('expresión simple', () => {
            const stmts = parseProgram('1 + 2;');
            assert.strictEqual(stmts[0].kind, 'ExpressionStmt');
            assert.strictEqual(stmts[0].expression.kind, 'Binary');
        });
        test('sin punto y coma lanza error', () => {
            assert.throws(() => parseProgram('1 + 2'));
        });
    });
    // ─── PrintStmt ─────────────────────────────────────────────────────────────
    suite('PrintStmt', () => {
        test('print literal', () => {
            const stmts = parseProgram('print 42;');
            assert.strictEqual(stmts[0].kind, 'PrintStmt');
            assert.strictEqual(stmts[0].expression.value, 42);
        });
        test('print string', () => {
            const stmts = parseProgram('print "hola";');
            assert.strictEqual(stmts[0].kind, 'PrintStmt');
        });
        test('print expresión', () => {
            const stmts = parseProgram('print 1 + 2;');
            assert.strictEqual(stmts[0].expression.kind, 'Binary');
        });
        test('sin punto y coma lanza error', () => {
            assert.throws(() => parseProgram('print 42'));
        });
    });
    // ─── VarDecl ───────────────────────────────────────────────────────────────
    suite('VarDecl', () => {
        test('declaración con inicializador', () => {
            const stmts = parseProgram('var x = 1;');
            const node = stmts[0];
            assert.strictEqual(node.kind, 'VarDecl');
            assert.strictEqual(node.name.lexeme, 'x');
            assert.strictEqual(node.initializer.value, 1);
        });
        test('declaración sin inicializador', () => {
            const stmts = parseProgram('var x;');
            const node = stmts[0];
            assert.strictEqual(node.initializer, null);
        });
        test('declaración con expresión', () => {
            const stmts = parseProgram('var x = 1 + 2;');
            const node = stmts[0];
            assert.strictEqual(node.initializer.kind, 'Binary');
        });
        test('sin nombre lanza error', () => {
            assert.throws(() => parseProgram('var = 1;'));
        });
        test('sin punto y coma lanza error', () => {
            assert.throws(() => parseProgram('var x = 1'));
        });
    });
    // ─── Block ─────────────────────────────────────────────────────────────────
    suite('Block', () => {
        test('bloque vacío', () => {
            const stmts = parseProgram('{}');
            const node = stmts[0];
            assert.strictEqual(node.kind, 'Block');
            assert.strictEqual(node.statements.length, 0);
        });
        test('bloque con statements', () => {
            const stmts = parseProgram('{ var x = 1; print x; }');
            const node = stmts[0];
            assert.strictEqual(node.statements.length, 2);
        });
        test('bloque sin cerrar lanza error', () => {
            assert.throws(() => parseProgram('{ var x = 1;'));
        });
    });
    // ─── IfStmt ────────────────────────────────────────────────────────────────
    suite('IfStmt', () => {
        test('if sin else', () => {
            const stmts = parseProgram('if (x) { print x; }');
            const node = stmts[0];
            assert.strictEqual(node.kind, 'IfStmt');
            assert.strictEqual(node.elseBranch, null);
        });
        test('if con else', () => {
            const stmts = parseProgram('if (x) { print x; } else { print 0; }');
            const node = stmts[0];
            assert.notStrictEqual(node.elseBranch, null);
        });
        test('condición es una expresión', () => {
            const stmts = parseProgram('if (x > 1) { print x; }');
            const node = stmts[0];
            assert.strictEqual(node.condition.kind, 'Binary');
        });
        test('sin paréntesis lanza error', () => {
            assert.throws(() => parseProgram('if x { print x; }'));
        });
    });
    // ─── WhileStmt ─────────────────────────────────────────────────────────────
    suite('WhileStmt', () => {
        test('while básico', () => {
            const stmts = parseProgram('while (x < 3) { print x; }');
            const node = stmts[0];
            assert.strictEqual(node.kind, 'WhileStmt');
            assert.strictEqual(node.condition.kind, 'Binary');
        });
        test('sin paréntesis lanza error', () => {
            assert.throws(() => parseProgram('while x < 3 { print x; }'));
        });
    });
    // ─── ForStmt (desazucarado a while) ────────────────────────────────────────
    suite('ForStmt', () => {
        test('for se desazucara a Block con WhileStmt', () => {
            const stmts = parseProgram('for (var i = 0; i < 3; i = i + 1) { print i; }');
            const node = stmts[0];
            assert.strictEqual(node.kind, 'Block');
            assert.strictEqual(node.statements[0].kind, 'VarDecl');
            assert.strictEqual(node.statements[1].kind, 'WhileStmt');
        });
        test('for sin inicializador', () => {
            const stmts = parseProgram('for (; i < 3; i = i + 1) { print i; }');
            assert.strictEqual(stmts[0].kind, 'WhileStmt');
        });
        test('for sin condición usa true', () => {
            const stmts = parseProgram('for (var i = 0;; i = i + 1) { print i; }');
            const block = stmts[0];
            const whileNode = block.statements[1];
            assert.strictEqual(whileNode.condition.value, true);
        });
        test('for sin incremento', () => {
            const stmts = parseProgram('for (var i = 0; i < 3;) { print i; }');
            const block = stmts[0];
            assert.strictEqual(block.statements[1].kind, 'WhileStmt');
        });
    });
    // ─── FunDecl ───────────────────────────────────────────────────────────────
    suite('FunDecl', () => {
        test('función sin parámetros', () => {
            const stmts = parseProgram('fun saludar() { print "hola"; }');
            const node = stmts[0];
            assert.strictEqual(node.kind, 'FunDecl');
            assert.strictEqual(node.name.lexeme, 'saludar');
            assert.strictEqual(node.params.length, 0);
        });
        test('función con parámetros', () => {
            const stmts = parseProgram('fun sumar(a, b) { return a + b; }');
            const node = stmts[0];
            assert.strictEqual(node.params.length, 2);
            assert.strictEqual(node.params[0].lexeme, 'a');
            assert.strictEqual(node.params[1].lexeme, 'b');
        });
        test('función con body', () => {
            const stmts = parseProgram('fun f() { var x = 1; return x; }');
            const node = stmts[0];
            assert.strictEqual(node.body.length, 2);
        });
        test('sin nombre lanza error', () => {
            assert.throws(() => parseProgram('fun () { }'));
        });
    });
    // ─── ReturnStmt ────────────────────────────────────────────────────────────
    suite('ReturnStmt', () => {
        test('return con valor', () => {
            const stmts = parseProgram('fun f() { return 1; }');
            const fun = stmts[0];
            const ret = fun.body[0];
            assert.strictEqual(ret.kind, 'ReturnStmt');
            assert.strictEqual(ret.value.value, 1);
        });
        test('return sin valor', () => {
            const stmts = parseProgram('fun f() { return; }');
            const fun = stmts[0];
            const ret = fun.body[0];
            assert.strictEqual(ret.value, null);
        });
        test('return con expresión', () => {
            const stmts = parseProgram('fun f() { return 1 + 2; }');
            const fun = stmts[0];
            const ret = fun.body[0];
            assert.strictEqual(ret.value.kind, 'Binary');
        });
    });
    // ─── programa completo ─────────────────────────────────────────────────────
    suite('programa completo', () => {
        test('múltiples statements', () => {
            const stmts = parseProgram('var x = 1;\nvar y = 2;\nprint x + y;');
            assert.strictEqual(stmts.length, 3);
        });
        test('función recursiva', () => {
            const stmts = parseProgram(`
                fun factorial(n) {
                    if (n <= 1) { return 1; }
                    return n * factorial(n - 1);
                }
            `);
            assert.strictEqual(stmts[0].kind, 'FunDecl');
        });
        test('for anidado en función', () => {
            const stmts = parseProgram(`
                fun contar() {
                    for (var i = 0; i < 3; i = i + 1) {
                        print i;
                    }
                }
            `);
            assert.strictEqual(stmts[0].kind, 'FunDecl');
        });
    });
});
suite('Parser - call', () => {
    test('llamada sin argumentos', () => {
        const node = expression('f()');
        assert.strictEqual(node.kind, 'Call');
        assert.strictEqual(node.callee.name.lexeme, 'f');
        assert.strictEqual(node.args.length, 0);
    });
    test('llamada con un argumento', () => {
        const node = expression('f(1)');
        assert.strictEqual(node.args.length, 1);
        assert.strictEqual(node.args[0].value, 1);
    });
    test('llamada con múltiples argumentos', () => {
        const node = expression('f(1, 2, 3)');
        assert.strictEqual(node.args.length, 3);
    });
    test('llamada con expresión como argumento', () => {
        const node = expression('f(1 + 2)');
        assert.strictEqual(node.args[0].kind, 'Binary');
    });
    test('llamada encadenada', () => {
        const node = expression('f()()');
        assert.strictEqual(node.kind, 'Call');
        assert.strictEqual(node.callee.kind, 'Call');
    });
    test('llamada recursiva como argumento', () => {
        const node = expression('f(f(1))');
        assert.strictEqual(node.args[0].kind, 'Call');
    });
    test('sin cerrar paréntesis lanza error', () => {
        assert.throws(() => expression('f(1'));
    });
});
//# sourceMappingURL=parser.test.js.map