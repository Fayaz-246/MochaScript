import fs from "node:fs";
import { lex } from "./lang/lexer.js";
import { parse } from "./lang/parse.js";
import { interpret } from "./lang/interpret.js";
// import readline from "readline";
import { Env } from "./backend/Environment.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Token } from "./extra/types.js";
import { types } from "./extra/enums.js";
import { formatAst } from "./extra/formatters.js";

const runtime = new Env();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const input = fs.readFileSync(path.join(__dirname, "..", "test.ms"), "utf8");

const tokens = lex(input);
// console.log(tokens.map(formatToken).join("\n"));

const ast = parse(tokens);

// console.log("");
// console.log(`AST: \n${formatAst(ast)}`);
// console.log("");

interpret(ast, runtime);

/*
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askForInput() {
  rl.question("\x1b[36m❯ Enter File Path\n❯ \x1b[0m", (input) => {
    if (input == "exit") {
      console.log("   Exiting Process");
      process.exit(0);
    }
    input = fs.readFileSync(path.resolve(process.cwd(), input), "utf8");
    const tokens = lex(input);
    const ast = parse(tokens);
    console.log("");
    console.log(`AST: \n ${JSON.stringify(ast, null, " ")}`);
    console.log("");
    console.log(typeof ast);
    // const res = interpret(ast, runtime);

    askForInput();
  });
}
console.log(process.cwd());

askForInput();
*/
function formatToken(t: Token): string {
  return `Type -> ${types[t.type]} || \t\t\t\t value -> ${t.value ?? "N/A"} `;
}
