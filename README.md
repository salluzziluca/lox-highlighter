# lox-highlighter

Extensión de Visual Studio Code que agrega syntax highlighting semántico para el lenguaje [Lox](https://craftinginterpreters.com).

## Qué hace

Colorea el código Lox en tiempo real mientras escribís, identificando:

- **Keywords**: `if`, `else`, `while`, `for`, `fun`, `var`, `return`, `and`, `or`, `true`, `false`, `nil`, `print`
- **Literales**: números, strings
- **Identificadores**: variables y funciones
- **Operadores**: aritméticos, de comparación y lógicos
- **Comentarios**: líneas que arrancan con `//`

## Cómo funciona

A diferencia de la mayoría de las extensiones de highlighting que usan expresiones regulares (gramáticas TextMate), esta extensión implementa un **lexer real** de Lox. Cada vez que el archivo cambia, VSCode le pasa el texto completo al lexer, que lo tokeniza y devuelve los tokens con su tipo y posición. VSCode usa esa información para aplicar los colores del tema activo.

## Instalación

Clonar el repositorio e instalar dependencias:

```bash
git clone https://github.com/salluzziluca/lox-highlighter
cd lox-highlighter
npm install
```

Abrir en VSCode y presionar `F5` para lanzar la extensión en modo desarrollo.

## Uso

Abrir cualquier archivo `.lox` en VSCode. El highlighting se aplica automáticamente.

## Estructura del proyecto

```
src/
  tokens.ts      — definición de TokenType, Token y keywords
  scanner.ts     — lexer que tokeniza el código fuente
  extension.ts   — punto de entrada, registra el provider con VSCode
```

## Contexto

Trabajo práctico para la materia **Lenguajes y Compiladores** de la Facultad de Ingeniería, UBA. El lexer implementado es compatible con la especificación de Lox descripta en [Crafting Interpreters](https://craftinginterpreters.com) de Robert Nystrom.