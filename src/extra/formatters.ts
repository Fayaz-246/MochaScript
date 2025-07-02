import { Statements, types } from "./enums.js";
import {
  Token,
  Node,
  DeclarationStatementValue,
  WriteStatementValue,
  BinaryExpressionValue,
  IfStatementValue,
  ElseIfClause,
  ForStatementValue,
} from "./types.js";

/** Format a raw token for debugging */
export function formatToken(t: Token): string {
  return `{ type: ${types[t.type]}, value: ${t.value ?? "N/A"} }`;
}

/** Recursively format any expression‑style node or literal */
function formatExpr(item: Node | string | number): string {
  if (typeof item === "object" && "identifier" in item) {
    return formatNode(item);
  }
  return String(item);
}

/** Format an `elsif` clause */
function formatElseIf(clause: ElseIfClause): string {
  const cond = formatExpr(clause.condition);
  const body = clause.body.map((n) => formatNode(n)).join("; ");
  return `elsif (${cond}) { ${body} }`;
}

/** Handlers for each Node type */
const nodeFormatters: Partial<Record<Statements, (n: Node) => string>> = {
  [Statements.NumberLiteral]: (n) => `Num(${n.value as number})`,

  [Statements.StringLiteral]: (n) => `Str("${n.value as string}")`,

  [Statements.Identifier]: (n) => `Id(${n.value as string})`,

  [Statements.BinaryExpression]: (n) => {
    const { left, operator, right } = n.value as BinaryExpressionValue;
    return `(${formatExpr(left)} ${operator} ${formatExpr(right)})`;
  },

  [Statements.DeclarationStatement]: (n) => {
    const { identifier, value } = n.value as DeclarationStatementValue;
    return `Declare ${identifier} = ${formatExpr(value)}`;
  },

  [Statements.AssignmentStatement]: (n) => {
    const { identifier, value } = n.value as DeclarationStatementValue;
    return `Assign ${identifier} = ${formatExpr(value)}`;
  },

  [Statements.ForStatement]: (n) => {
    const { init, condition, update, body } = n.value as ForStatementValue;
    const initStr = formatNode(init);
    const condStr = formatExpr(condition);
    const updateStr = formatExpr(update);
    const bodyStr = body.map((stmt) => formatNode(stmt)).join("; ");
    return `for (${initStr}; ${condStr}; ${updateStr}) { ${bodyStr} }`;
  },

  [Statements.IfStatement]: (n) => {
    const { condition, thenBranch, elseIfs, elseBranch } =
      n.value as IfStatementValue;
    const condStr = formatExpr(condition);
    const thenStr = thenBranch.map((stmt) => formatNode(stmt)).join("; ");
    let s = `if (${condStr}) { ${thenStr} }`;
    for (const ei of elseIfs ?? []) {
      s += " " + formatElseIf(ei);
    }
    if (elseBranch) {
      const elseStr = elseBranch.map((stmt) => formatNode(stmt)).join("; ");
      s += ` else { ${elseStr} }`;
    }
    return s;
  },

  [Statements.WriteStatement]: (n) => {
    const { expr, text } = n.value as WriteStatementValue;
    if (text !== undefined) {
      return `WriteStr("${text}")`;
    } else if (expr) {
      return `WriteExpr(${formatExpr(expr)})`;
    }
    return `Write(?)`;
  },

  [Statements.WriteLineStatement]: (n) => {
    const { expr, text } = n.value as WriteStatementValue;
    if (text !== undefined) {
      return `WriteLnStr("${text}")`;
    } else if (expr) {
      return `WriteLnExpr(${formatExpr(expr)})`;
    }
    return `WriteLn(?)`;
  },

  [Statements.ReturnStatement]: (n) => `Return ${formatExpr(n.value as Node)}`,

  [Statements.CommentStatement]: (n) => `Comment(${JSON.stringify(n.value)})`,
};

/** Format a single AST node via the registry */
export function formatNode(node: Node): string {
  const fn = nodeFormatters[node.identifier];
  if (fn) return fn(node);
  return `UnknownNode(${node.identifier})`;
}

/** Format a full AST */
export function formatAst(ast: Node[]): string {
  return ast
    .map((n, i) => `${i < 10 ? `0${i}` : i}: ${formatNode(n)}`)
    .join("\n");
}
