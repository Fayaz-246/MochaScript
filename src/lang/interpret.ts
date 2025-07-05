import Env, { AlphaNumBool, VariableValue } from "../backend/Environment.js";
import { keywords, Statements } from "../extra/enums.js";
import {
  BinaryExpressionValue,
  DeclarationStatementValue,
  WriteStatementValue,
  IfStatementValue,
  Node,
  ForStatementValue,
} from "../extra/types.js";
import process from "node:process";

const stdout = (s: string) => process.stdout.write(s);

/** --------------------------------------------------------------------------
 * Evaluate an expression Node to a JS number or string.
 * Supports: literals, identifiers, binary ops, nested returns.
 * -------------------------------------------------------------------------- */
function evalExpr(node: Node, runtime: Env): AlphaNumBool {
  switch (node.identifier) {
    case Statements.NumberLiteral:
      return node.value as number;

    case Statements.StringLiteral:
      return node.value as string;

    case Statements.Boolean:
      return node.value as boolean;

    case Statements.Identifier: {
      const name = node.value as string;
      const v = runtime.getVar(name);
      if (v === undefined) throw new Error(`Unknown variable: ${name}`);
      return v.value;
    }

    case Statements.BinaryExpression: {
      const { left, operator, right } = node.value as BinaryExpressionValue;
      const L = Number(evalExpr(left, runtime));
      const R = Number(evalExpr(right, runtime));
      switch (operator) {
        case "+":
          return L + R;
        case "-":
          return L - R;
        case "*":
          return L * R;
        case "/":
          return L / R;
        case "%":
          return L % R;
        case "^":
          return Math.pow(L, R);
        case ">":
          return L > R ? 1 : 0;
        case "<":
          return L < R ? 1 : 0;
        case ">=":
          return L >= R ? 1 : 0;
        case "<=":
          return L <= R ? 1 : 0;
        case "==":
          return L === R ? 1 : 0;
        case "!=":
          return L !== R ? 1 : 0;
      }
      throw new Error(`Bad operator: ${operator}`);
    }

    case Statements.ReturnStatement:
      return evalExpr(node.value as Node, runtime);

    default:
      throw new Error(`Cannot eval expression node: ${node.identifier}`);
  }
}

/** --------------------------------------------------------------------------
 * Execute a single statement node.
 * Returns a value only for ReturnStatement, otherwise undefined.
 * -------------------------------------------------------------------------- */
function evalStmt(node: Node, runtime: Env): any {
  switch (node.identifier) {
    case Statements.DeclarationStatement: {
      const { identifier, value, mutable } =
        node.value as DeclarationStatementValue;
      if (keywords.includes(identifier)) {
        throw new Error(`Identifier cannot be a keyword: ${identifier}`);
      }
      const val = evalExpr(value as Node, runtime);
      runtime.declareVar(identifier, { value: val, mutable });
      return;
    }

    case Statements.AssignmentStatement: {
      const { identifier, value } = node.value as DeclarationStatementValue;
      if (!runtime.hasVar(identifier))
        throw new Error("Cannot assign to an undeclared variable.");
      const val = evalExpr(value as Node, runtime);
      runtime.assignVar(identifier, val);
      return;
    }

    case Statements.IfStatement: {
      const { condition, thenBranch, elseIfs, elseBranch } =
        node.value as IfStatementValue;

      const condVal = evalExpr(condition, runtime);
      const isTrue = condVal !== 0 && condVal !== "" && condVal !== null;

      if (isTrue) {
        for (const stmt of thenBranch) {
          const r = evalStmt(stmt, runtime);
          if (stmt.identifier === Statements.ReturnStatement) return r;
        }
      } else {
        if (!elseIfs) return;
        for (const { condition: ec, body } of elseIfs) {
          if (evalExpr(ec, runtime) !== 0) {
            for (const stmt of body) {
              const r = evalStmt(stmt, runtime);
              if (stmt.identifier === Statements.ReturnStatement) return r;
            }
            return;
          }
        }
        if (elseBranch) {
          for (const stmt of elseBranch) {
            const r = evalStmt(stmt, runtime);
            if (stmt.identifier === Statements.ReturnStatement) return r;
          }
        }
      }
      return;
    }

    case Statements.ForStatement: {
      const { init, condition, update, body } = node.value as ForStatementValue;

      evalStmt(init, runtime);

      while (Number(evalExpr(condition, runtime)) !== 0) {
        for (const stmt of body) {
          const r = evalStmt(stmt, runtime);
          if (stmt.identifier === Statements.ReturnStatement) {
            return r;
          }
        }
        evalStmt(update, runtime);
      }
      break;
    }

    case Statements.WriteStatement:
    case Statements.WriteLineStatement: {
      const w = node.value as WriteStatementValue;
      if (w.text !== undefined) {
        stdout(w.text);
      } else if (w.expr) {
        const v = evalExpr(w.expr, runtime);
        stdout(String(v));
      } else {
        throw new Error("Invalid write payload");
      }
      if (node.identifier === Statements.WriteLineStatement) {
        stdout("\n");
      }
      return;
    }

    case Statements.ReturnStatement: {
      const r = evalExpr(node.value as Node, runtime);
      return r;
    }

    case Statements.CommentStatement:
      return;

    default:
      throw new Error(`Unknown statement node: ${node.identifier}`);
  }
}

/** --------------------------------------------------------------------------
 * Walk the AST and execute each top‑level statement.
 * On ReturnStatement, exits the process with the returned code.
 * -------------------------------------------------------------------------- */
export function interpret(ast: Node[], runtime: Env): void {
  for (const node of ast) {
    const result = evalStmt(node, runtime);
    if (node.identifier === Statements.ReturnStatement) {
      const code = Number(result);
      process.exit(isNaN(code) ? 0 : code);
    }
  }
}
