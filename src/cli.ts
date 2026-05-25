import * as fs from 'fs';
import * as path from 'path';
import { Scanner } from './scanner';
import { Parser, ParseError } from './parser';
import { SemanticResolver } from './semantic-resolver';
import { UsageResolver } from './usage-resolver';

const file = process.argv[2];

if (!file) {
	console.error('Usage: node out/cli.js <file.lox>');
	process.exit(2);
}

const source = fs.readFileSync(path.resolve(file), 'utf-8');
const tokens = new Scanner(source).scan();

let stmts;
try {
	stmts = new Parser(tokens).parse();
} catch (e) {
	if (e instanceof ParseError) {
		console.log(`PARSE ERROR [${e.token.line}:${e.token.column}]: ${e.message}`);
	} else {
		console.log(`ERROR: ${String(e)}`);
	}
	process.exit(1);
}

const semanticErrors = new SemanticResolver().resolve(stmts);
for (const err of semanticErrors) {
	console.log(`SEMANTIC ERROR [${err.token.line}:${err.token.column}]: ${err.message}`);
}

if (semanticErrors.length > 0) {
	process.exit(1);
}

console.log('OK');
