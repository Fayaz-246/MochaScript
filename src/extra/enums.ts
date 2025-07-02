// RESERVED KEYWORDS
export const keywords: string[] = [
  "def",
  "return",
  "write",
  "writeln",
  "if",
  "elif",
  "else",
  "for",
] as const;

// TOKEN TYPES
export enum types {
  alpha, // identifier start
  alphanum, // mixed letters+digits
  assign, // =
  binary_ops, // + - * / % ^
  comparison_ops, // > < >= <= == !=
  comment, // @…newline comments
  def, // 'def' keyword

  // grouping: ()[]{} stay together
  left_paren, // (
  right_paren, // )
  left_brace, // {
  right_brace, // }

  numeric, // 123
  ret, // 'ret' keyword

  // grouping: string delimiters + content
  str_dec, // "
  str, // "…content…"

  // If statements
  if,
  elif,
  else,

  // For
  for,

  write, // 'write' keyword
  writeln, // 'writeln' keyword

  semi, // ;
}

// AST STATEMENT KINDS
export enum Statements {
  // expressions & literals
  BinaryExpression, // a + b, etc.
  Identifier, // variable names
  NumberLiteral, // numeric literal
  StringLiteral, // string literal

  IfStatement,
  ForStatement,

  // top‑level statements
  CommentStatement, // comments
  DeclarationStatement, // def x = …
  AssignmentStatement, // x = …
  ReturnStatement, // return …
  WriteStatement, // write(…);
  WriteLineStatement, // writeln(…);
}
