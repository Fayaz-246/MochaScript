import { Statements, types } from "./enums";

/** A single token from the lexer */
export type Token = {
  type: types;
  value?: string;
};

/** Payload for a `def x = <expr>;` statement */
export interface DeclarationStatementValue {
  identifier: string;
  value: Node;
}

/** Payload for `write(...)` / `writeln(...)` statements */
export interface WriteStatementValue {
  /** String literal: `write("hello")` */
  text?: string;
  /** Any expression: `write(1+2)` or `write(x)` */
  expr?: Node;
}

/** Payload for a binary expression node (`a + b`, `x * y`, etc.) */
export interface BinaryExpressionValue {
  left: Node;
  operator: string;
  right: Node;
}

/* Content for Else If (elif) */
export interface ElseIfClause {
  condition: Node;
  body: Node[];
}

export interface IfStatementValue {
  condition: Node;
  thenBranch: Node[];
  elseIfs?: ElseIfClause[];
  elseBranch?: Node[];
}

export interface ForStatementValue {
  init: Node; // e.g. a DeclarationStatement or an AssignmentStatement
  condition: Node; // any expression node
  update: Node; // any expression node
  body: Node[]; // array of statements
}

/** The AST node types for the language */
export type Node =
  /* ── Literals ───────────────────────────────────── */
  | { identifier: Statements.NumberLiteral; value: number }
  | { identifier: Statements.StringLiteral; value: string }

  /* ── Identifiers ────────────────────────────────── */
  | { identifier: Statements.Identifier; value: string }

  /* ── Expressions ────────────────────────────────── */
  | { identifier: Statements.BinaryExpression; value: BinaryExpressionValue }
  /* ── Control Statements ────────────────────────────────── */
  | { identifier: Statements.IfStatement; value: IfStatementValue }
  /* ── Loops ────────────────────────────────── */
  | { identifier: Statements.ForStatement; value: ForStatementValue }
  /* ── Top‑level Statements ───────────────────────── */
  | {
      identifier: Statements.DeclarationStatement;
      value: DeclarationStatementValue;
    }
  | {
      identifier: Statements.AssignmentStatement;
      value: DeclarationStatementValue;
    }
  | { identifier: Statements.WriteStatement; value: WriteStatementValue }
  | { identifier: Statements.WriteLineStatement; value: WriteStatementValue }
  | { identifier: Statements.ReturnStatement; value: Node }
  | { identifier: Statements.CommentStatement; value: string };
