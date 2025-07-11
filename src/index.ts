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

// const input = fs.readFileSync(path.join(__dirname, "..", "test.ms"), "utf8");

// const parser = new Parser(input);
// parser.logTokens();
// const ast = parser.getAST();
// parser.logAST();

// interpret(ast, runtime);

const readLineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
process.stdout.write("MochaScript v0.0.1\n");
function repl() {
  readLineInterface.question("> ", (input) => {
    if (input == "exit") {
      process.stderr.write(">> Exiting Process");
      process.exit(0);
    }
    const parser = new Parser(input);
    parser.logTokens();
    parser.getAST();
    parser.logAST();
    interpret(parser.getAST(), runtime);

    repl();
  });
}

repl();
