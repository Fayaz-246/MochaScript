import { Statements, types } from "./enums";

/** A single token from the lexer */
export type Token = {
  type: types;
  value?: string;
};

/** Payload for a `def x = <expr>;` statement */
export interface AssignmentStatementValue {
  identifier: string;
  value: Node;
}

export interface DeclarationStatementValue extends AssignmentStatementValue {
  mutable: boolean;
}

/** Payload for `write(...)` / `writeln(...)` statements */
export interface WriteStatementValue {
  text?: string;
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
  init: Node;
  condition: Node;
  update: Node;
  body: Node[];
}

/** The AST node types for the language */
export type Node =
  /* ── Literals ───────────────────────────────────── */
  | { identifier: Statements.NumberLiteral; value: number }
  | { identifier: Statements.StringLiteral; value: string }
  | { identifier: Statements.Boolean; value: boolean }

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
      value: AssignmentStatementValue;
    }
  | { identifier: Statements.WriteStatement; value: WriteStatementValue }
  | { identifier: Statements.WriteLineStatement; value: WriteStatementValue }
  | { identifier: Statements.ReturnStatement; value: Node }
  | { identifier: Statements.CommentStatement; value: string };
