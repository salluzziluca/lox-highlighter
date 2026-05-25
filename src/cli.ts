import * as fs from 'fs';
import * as path from 'path';
import { Scanner } from './scanner';
import { Parser, ParseError } from './parser';
import { SemanticResolver } from './semantic-resolver';
import { UsageResolver } from './usage-resolver';

const args = process.argv.slice(2);
const benchIdx = args.indexOf('--bench');
const isBench = benchIdx !== -1;
const iterations = isBench ? parseInt(args[benchIdx + 1] ?? '100', 10) : 1;
const benchArgIndices = new Set(isBench ? [benchIdx, benchIdx + 1] : []);
const file = args.find((a, i) => !a.startsWith('--') && !benchArgIndices.has(i));

if (!file) {
	console.error('Usage: node out/cli.js <file.lox> [--bench N]');
	process.exit(2);
}

const source = fs.readFileSync(path.resolve(file), 'utf-8');

function runPipeline() {
	const tokens = new Scanner(source).scan();
	const stmts = new Parser(tokens).parse();
	new SemanticResolver().resolve(stmts);
	new UsageResolver().resolve(stmts);
	return stmts;
}

if (isBench) {
	runPipeline(); // warmup

	const scanTimes: number[] = [];
	const parseTimes: number[] = [];
	const semanticTimes: number[] = [];
	const usageTimes: number[] = [];

	for (let i = 0; i < iterations; i++) {
		let t = performance.now();
		const tokens = new Scanner(source).scan();
		scanTimes.push(performance.now() - t);

		t = performance.now();
		const stmts = new Parser(tokens).parse();
		parseTimes.push(performance.now() - t);

		t = performance.now();
		new SemanticResolver().resolve(stmts);
		semanticTimes.push(performance.now() - t);

		t = performance.now();
		new UsageResolver().resolve(stmts);
		usageTimes.push(performance.now() - t);
	}

	const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
	const fmt = (ms: number) => `${ms.toFixed(4)}ms`;

	console.log(`\nBenchmark: ${file} (${iterations} iterations)\n`);
	console.log(`  Scanner:           ${fmt(avg(scanTimes))}`);
	console.log(`  Parser:            ${fmt(avg(parseTimes))}`);
	console.log(`  SemanticResolver:  ${fmt(avg(semanticTimes))}`);
	console.log(`  UsageResolver:     ${fmt(avg(usageTimes))}`);
	console.log(`  Total (avg):       ${fmt(avg(scanTimes) + avg(parseTimes) + avg(semanticTimes) + avg(usageTimes))}`);
	process.exit(0);
}

let stmts;
try {
	stmts = new Parser(new Scanner(source).scan()).parse();
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
