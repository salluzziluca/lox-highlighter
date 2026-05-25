# lox-highlighter

Extensión de Visual Studio Code que agrega syntax highlighting semántico para el lenguaje [Lox](https://craftinginterpreters.com).

## Qué hace

Colorea el código Lox en tiempo real mientras escribís, identificando:

- **Keywords**: `if`, `else`, `while`, `for`, `fun`, `var`, `return`, `and`, `or`, `true`, `false`, `nil`, `print`
- **Literales**: números, strings
- **Identificadores**: variables y funciones
- **Operadores**: aritméticos, de comparación y lógicos
- **Comentarios**: líneas que arrancan con `//`

También detecta errores y problemas en el código sin necesidad de correrlo:

- **Errores semánticos**: variables usadas antes de ser declaradas, redeclaración en el mismo scope, `return` fuera de una función
- **Código muerto**: instrucciones inalcanzables después de un `return`
- **Símbolos sin usar**: variables, funciones y parámetros declarados pero nunca usados

## Cómo funciona

A diferencia de la mayoría de las extensiones de highlighting que usan expresiones regulares (gramáticas TextMate), esta extensión implementa un **lexer real** de Lox. Cada vez que el archivo cambia, VSCode le pasa el texto completo al lexer, que lo tokeniza y devuelve los tokens con su tipo y posición. VSCode usa esa información para aplicar los colores del tema activo.

Luego de la aplicación de colores, para la detección de errores se realiza un análisis en dos etapas. El SemanticResolver recorre el AST con un stack de scopes para detectar problemas de variables y funciones. El UsageResolver hace un segundo pasaje para marcar código inalcanzable y símbolos declarados pero nunca usados.

## Demo

En este video se puede ver una breve demo del programa.

https://youtube.com/shorts/V2XdSaHqMpA?feature=share

## Instalación

La forma más rápida es descargar el archivo `lox-highlighter-0.0.1.vsix` e instalarlo con:

```bash
code --install-extension lox-highlighter-0.0.1.vsix
```

Si preferís correrlo en modo desarrollo, clonar e instalar dependencias:

```bash
git clone https://github.com/salluzziluca/lox-highlighter
cd lox-highlighter
npm install
```

Abrir en VSCode y presionar `F5` para lanzar la extensión en modo desarrollo.

## Uso

Abrir cualquier archivo `.lox` en VSCode. El highlighting se aplica automáticamente.

Para correr el analizador por fuera de VSCode hay un CLI:

```bash
node out/cli.js archivo.lox
```

El repo también incluye los casos de prueba de [plox](https://github.com/FdelMazo/plox) adaptados para correr con el analizador:

```bash
python3 real-tests/script.py
```

Y un modo benchmark para medir cuánto tarda cada etapa del pipeline:

```bash
node out/cli.js real-tests/3-minsky.lox --bench 500
```

## Estructura del proyecto

```
src/
  tokens.ts             — definición de TokenType, Token y keywords
  scanner.ts            — lexer que tokeniza el código fuente
  parser.ts             — parser que construye el AST
  ast.ts                — definición de los nodos del AST
  resolver.ts           — resolución de tokens para el highlighting
  semantic-resolver.ts  — análisis semántico (scope, redeclaración, return)
  usage-resolver.ts     — detección de código muerto y símbolos sin usar
  cli.ts                — entrada por línea de comandos
  extension.ts          — punto de entrada, registra el provider con VSCode
real-tests/             — casos de prueba de integración
```

## Contexto

Trabajo práctico para la materia **Lenguajes y Compiladores** de la Facultad de Ingeniería, UBA. El lexer implementado es compatible con la especificación de Lox descripta en [Crafting Interpreters](https://craftinginterpreters.com) de Robert Nystrom.
