import { Statements, types } from "../extra/enums.js";
import { formatAst } from "../extra/formatters.js";
import {
  AssignmentStatementValue,
  BinaryExpressionValue,
  DeclarationStatementValue,
  ElseIfClause,
  ForStatementValue,
  IfStatementValue,
  Node,
  Token,
  WriteStatementValue,
} from "../extra/types.js";
import lex from "./lexer.js";

/* ─────────────────────── Operator Precedence ─────────────────────── */
const operatorPrecedence: Record<string, number> = {
  "^": 4,
  "*": 3,
  "/": 3,
  "%": 3,
  "+": 2,
  "-": 2,
  ">": 1,
  "<": 1,
  ">=": 1,
  "<=": 1,
  "==": 1,
  "!=": 1,
};
const rightAssociative = new Set<string>(["^"]);
/** --------------------------------------------------------------------------
 * Parse the tokens into an AST.
 * -------------------------------------------------------------------------- */
export default class Parser {
  private tokens: Token[];
  private cur: number;
  private ast: Node[] = new Array<Node>();

  constructor(src: string) {
    this.tokens = lex(src);
    this.cur = 0;
  }

  /** Entry point to parse the token list into an AST */
  public getAST(): Node[] {
    while (this.cur < this.tokens.length) {
      this.skipComments();
      if (!this.peek()) break;
      this.ast.push(this.parseStatement());
    }
    return this.ast;
  }

  public logAST() {
    console.log("");
    console.log(`AST: \n${formatAst(this.ast)}`);
    console.log("");
  }

  public logTokens() {
    console.log("");
    console.log(this.tokens.map(this.formatToken).join("\n"));
    console.log("");
  }

  /* —— Helpers —— */
  private peek(): Token | undefined {
    return this.tokens[this.cur];
  }

  private advance(): Token | undefined {
    return this.tokens[this.cur++];
  }

  private expect(t: types): Token {
    const tk = this.advance();
    if (!tk || tk.type !== t) {
      throw new Error(
        `Expected token ${t}, got ${JSON.stringify(tk, null, 1)}`
      );
    }
    return tk;
  }

  private skipComments(): void {
    while (this.peek()?.type === types.comment) this.advance();
  }

  /* Parse a literal: string or boolean */
  private parseLiteral(): Node {
    if (this.peek()?.type === types.str_dec) {
      this.advance();
      const strTk = this.expect(types.str);
      this.expect(types.str_dec);
      return { identifier: Statements.StringLiteral, value: strTk.value! };
    }

    if (this.peek()?.type === types.true || this.peek()?.type === types.false) {
      const boolTk = this.advance()!;
      return {
        identifier: Statements.Boolean,
        value: boolTk.type === types.true,
      };
    }

    throw new Error(`Unexpected literal token: ${this.peek()?.type}`);
  }

  /* —— parsePrimary: number, identifier, or parenthesized expr —— */
  private parsePrimary(): Node {
    const tk = this.advance();
    if (!tk) throw new Error("Unexpected EOF in primary");

    if (
      tk?.type === types.str_dec ||
      tk?.type === types.true ||
      tk?.type === types.false
    ) {
      return this.parseLiteral();
    }

    if (tk.type === types.numeric) {
      return { identifier: Statements.NumberLiteral, value: Number(tk.value) };
    }
    if (tk.type === types.alpha || tk.type === types.alphanum) {
      return { identifier: Statements.Identifier, value: tk.value! };
    }
    if (tk.type === types.left_paren) {
      const expr = this.parseBinaryExpression();
      this.expect(types.right_paren);
      return expr;
    }

    throw new Error(
      `Unexpected primary token: ${tk.type} ${JSON.stringify(tk, null, 2)}`
    );
  }

  /* —— parseBinaryExpression: handles both arithmetic and comparisons —— */
  private parseBinaryExpression(minPrec = 0): Node {
    let leftNode = this.parsePrimary();

    while (true) {
      const opTk = this.peek();
      if (
        !opTk ||
        (opTk.type !== types.binary_ops && opTk.type !== types.comparison_ops)
      ) {
        break;
      }

      const prec = operatorPrecedence[opTk.value!];
      if (prec < minPrec) break;

      this.advance();
      const nextMin = rightAssociative.has(opTk.value!) ? prec : prec + 1;
      const rightNode = this.parseBinaryExpression(nextMin);

      leftNode = {
        identifier: Statements.BinaryExpression,
        value: {
          left: leftNode,
          operator: opTk.value!,
          right: rightNode,
        } as BinaryExpressionValue,
      };
    }

    return leftNode;
  }

  /* —— parseStatement: dispatch based on peeked token —— */
  private parseStatement(): Node {
    this.skipComments();
    const tk = this.peek()!;
    switch (tk.type) {
      case types.comment:
        const c = this.advance()!;
        return { identifier: Statements.CommentStatement, value: c.value! };

      case types.def:
        this.advance();
        return this.parseVariableDeclarationAndAssignment(
          Statements.DeclarationStatement
        );

      case types.alpha:
      case types.alphanum:
        return this.parseVariableDeclarationAndAssignment(
          Statements.AssignmentStatement
        );

      case types.if:
        this.advance();
        return this.parseIf();

      case types.for:
        this.advance();
        return this.parseFor();

      case types.ret:
        this.advance();
        return this.parseReturn();

      case types.write:
        this.advance();
        return this.parseWrite();

      case types.writeln:
        this.advance();
        return this.parseWriteLine();

      default:
        throw new Error(`Unexpected token in statement: ${tk.type}`);
    }
  }

  /* -- parseVariableDeclarationAndAssignment —— */
  private parseVariableDeclarationAndAssignment(
    type: Statements.AssignmentStatement | Statements.DeclarationStatement
  ): Node {
    const isMutable = this.peek()!.type === types.mut;
    if (isMutable) this.advance();
    const id = this.expect(
      this.peek()!.type === types.alphanum ? types.alphanum : types.alpha
    ).value!;
    this.expect(types.assign);

    const valueNode =
      this.peek() &&
      [types.str_dec, types.true, types.false].includes(this.peek()!.type)
        ? this.parseLiteral()
        : this.parseBinaryExpression();
    this.expect(types.semi);

    const payload = { identifier: id, value: valueNode };
    if (type === Statements.DeclarationStatement) {
      return {
        identifier: type,
        value: { ...payload, mutable: isMutable } as DeclarationStatementValue,
      };
    }

    return {
      identifier: type,
      value: payload as AssignmentStatementValue,
    };
  }

  /* —— parseIf: if (…) {…} [elsif …]* [else …] —— */
  private parseIf(): Node {
    let condition: Node;
    if (this.peek()?.type === types.left_paren) {
      this.advance();
      condition = this.parseBinaryExpression();
      this.expect(types.right_paren);
    } else {
      condition = this.parseBinaryExpression();
    }

    this.expect(types.left_brace);
    const thenBranch: Node[] = [];
    while (
      this.peek()?.type !== types.right_paren &&
      this.peek()?.type !== types.right_brace
    ) {
      thenBranch.push(this.parseStatement());
    }
    this.expect(types.right_brace);

    const elseIfs: ElseIfClause[] = [];
    while (this.peek()?.type === types.elif) {
      this.advance();
      let ec: Node;
      if (this.peek()?.type === types.left_paren) {
        this.advance();
        ec = this.parseBinaryExpression();
        this.expect(types.right_paren);
      } else {
        ec = this.parseBinaryExpression();
      }
      this.expect(types.left_brace);
      const eb: Node[] = [];
      while (this.peek()?.type !== types.right_brace) {
        eb.push(this.parseStatement());
      }
      this.expect(types.right_brace);
      elseIfs.push({ condition: ec, body: eb });
    }

    let elseBranch: Node[] | undefined;
    if (this.peek()?.type === types.else) {
      this.advance();
      this.expect(types.left_brace);
      elseBranch = [];
      while (this.peek()?.type !== types.right_brace) {
        elseBranch.push(this.parseStatement());
      }
      this.expect(types.right_brace);
    }

    return {
      identifier: Statements.IfStatement,
      value: { condition, thenBranch, elseIfs, elseBranch } as IfStatementValue,
    };
  }

  /* —— parseFor: for(…) {…} —— */
  private parseFor(): Node {
    this.expect(types.left_paren);

    let init: Node;
    if (this.peek()?.type === types.def) {
      this.advance();
      init = this.parseVariableDeclarationAndAssignment(
        Statements.DeclarationStatement
      );
    } else {
      init = this.parseVariableDeclarationAndAssignment(
        Statements.AssignmentStatement
      );
    }

    const condition = this.parseBinaryExpression();
    this.expect(types.semi);

    let update: Node;
    if (
      (this.peek()?.type === types.alpha ||
        this.peek()?.type === types.alphanum) &&
      this.tokens[this.cur + 1]?.type === types.assign
    ) {
      const idTk = this.expect(
        this.peek()!.type === types.alphanum ? types.alphanum : types.alpha
      );
      this.expect(types.assign);
      const rhs = this.parseBinaryExpression();
      update = {
        identifier: Statements.AssignmentStatement,
        value: {
          identifier: idTk.value!,
          value: rhs,
        } as DeclarationStatementValue,
      };
    } else {
      update = this.parseBinaryExpression();
    }
    this.expect(types.right_paren);

    this.expect(types.left_brace);
    const body: Node[] = [];
    while (this.peek()?.type !== types.right_brace) {
      body.push(this.parseStatement());
    }
    this.expect(types.right_brace);

    return {
      identifier: Statements.ForStatement,
      value: { init, condition, update, body } as ForStatementValue,
    };
  }

  /** Parse a return statement */
  private parseReturn(): Node {
    const expr = this.parseBinaryExpression();
    this.expect(types.semi);
    return { identifier: Statements.ReturnStatement, value: expr };
  }

  /** Factory for write / writeln parsers */
  private makeWriteParser(
    kind: Statements.WriteStatement | Statements.WriteLineStatement
  ) {
    return (): Node => {
      this.expect(types.left_paren);
      let payload: WriteStatementValue;
      if (this.peek()?.type === types.str_dec) {
        this.advance();
        const s = this.expect(types.str);
        this.expect(types.str_dec);
        payload = { text: s.value! };
      } else {
        payload = { expr: this.parseBinaryExpression() };
      }
      this.expect(types.right_paren);
      this.expect(types.semi);
      return { identifier: kind, value: payload };
    };
  }

  private parseWrite = this.makeWriteParser(Statements.WriteStatement);
  private parseWriteLine = this.makeWriteParser(Statements.WriteLineStatement);

  private formatToken(t: Token): string {
    return `Type -> ${types[t.type]} || \t\t\t\t value -> ${t.value ?? "N/A"} `;
  }
}
