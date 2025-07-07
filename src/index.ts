import fs from "node:fs";
import Parser from "./lang/parse.js";
import { interpret } from "./lang/interpret.js";
import readline from "readline";
import Env from "./backend/Environment.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
const runtime = new Env();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const input = fs.readFileSync(path.join(__dirname, "..", "test.ms.bk"), "utf8");

const sDate = Date.now();
const parser = new Parser(input);
const ast = parser.getAST();
interpret(ast, runtime);

console.log(`* Time taken ${Date.now() - sDate}ms`);

// const readLineInterface = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });
// process.stdout.write("MochaScript v0.0.1\n");
// function repl() {
//   readLineInterface.question("> ", (input) => {
//     if (input == "exit") {
//       process.stderr.write(">> Exiting Process");
//       process.exit(0);
//     }
//     const parser = new Parser(input);
//     interpret(parser.getAST(), runtime);
//
//     repl();
//   });
// }
//
// repl();
