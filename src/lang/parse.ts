import { Statements, types } from "../extra/enums.js";
import {
  BinaryExpressionValue,
  DeclarationStatementValue,
  ElseIfClause,
  ForStatementValue,
  IfStatementValue,
  Node,
  Token,
  WriteStatementValue,
} from "../extra/types.js";

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
const rightAssociative = new Set(["^"]);

/** --------------------------------------------------------------------------
 * Parse the tokens into an AST.
 * -------------------------------------------------------------------------- */
export default function parse(tokens: Token[]): Node[] {
  let cur = 0;

  /* —— Helpers —— */
  const peek = () => tokens[cur];
  const advance = () => tokens[cur++];
  const expect = (t: types) => {
    const tk = advance();
    if (!tk || tk.type !== t) {
      throw new Error(
        `Expected token ${t}, got ${JSON.stringify(tk, null, 1)}`
      );
    }
    return tk;
  };
  function skipComments() {
    while (peek()?.type === types.comment) advance();
  }

  /* —— parsePrimary: number, identifier, or parenthesized expr —— */
  function parsePrimary(): Node {
    const tk = advance();
    if (!tk) throw new Error("Unexpected EOF in primary");

    if (tk.type === types.numeric) {
      return { identifier: Statements.NumberLiteral, value: Number(tk.value) };
    }
    if (tk.type === types.alpha || tk.type === types.alphanum) {
      return { identifier: Statements.Identifier, value: tk.value! };
    }
    if (tk.type === types.left_paren) {
      const expr = parseBinaryExpression();
      expect(types.right_paren);
      return expr;
    }

    throw new Error(
      `Unexpected primary token: ${tk.type} ${JSON.stringify(tk, null, 2)}`
    );
  }

  /* —— parseBinaryExpression: handles both arithmetic and comparisons —— */
  function parseBinaryExpression(minPrec = 0): Node {
    let leftNode = parsePrimary();

    while (true) {
      const opTk = peek();
      if (
        !opTk ||
        (opTk.type !== types.binary_ops && opTk.type !== types.comparison_ops)
      ) {
        break;
      }

      const prec = operatorPrecedence[opTk.value!];
      if (prec < minPrec) break;

      advance();

      const nextMin = rightAssociative.has(opTk.value!) ? prec : prec + 1;
      const rightNode = parseBinaryExpression(nextMin);

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
  function parseStatement(): Node {
    skipComments();
    const tk = peek()!;
    switch (tk.type) {
      case types.comment:
        const c = advance()!;
        return { identifier: Statements.CommentStatement, value: c.value! };

      case types.def:
        advance();
        return parseVariableDeclarationAndAssignment(
          Statements.DeclarationStatement
        );

      case types.alpha:
      case types.alphanum:
        return parseVariableDeclarationAndAssignment(
          Statements.AssignmentStatement
        );

      case types.if:
        advance();
        return parseIf();

      case types.for:
        advance();
        return parseFor();

      case types.ret:
        advance();
        return parseReturn();

      case types.write:
        advance();
        return parseWrite();

      case types.writeln:
        advance();
        return parseWriteLine();

      default:
        throw new Error(`Unexpected token in statement: ${tk.type}`);
    }
  }

  /* -- parseAssignment: def x =  <expr|string>; || x = <expr|string>; —— */
  function parseVariableDeclarationAndAssignment(
    type: Statements.AssignmentStatement | Statements.DeclarationStatement
  ): Node {
    const idTk = expect(
      peek()!.type === types.alphanum ? types.alphanum : types.alpha
    );
    expect(types.assign);

    let valueNode: Node;
    if (peek()?.type === types.str_dec) {
      advance();
      const strTk = expect(types.str);
      expect(types.str_dec);
      valueNode = { identifier: Statements.StringLiteral, value: strTk.value! };
    } else {
      valueNode = parseBinaryExpression();
    }
    expect(types.semi);

    return {
      identifier: type,
      value: {
        identifier: idTk.value!,
        value: valueNode,
      } as DeclarationStatementValue,
    };
  }

  /* —— parseIf: if (…) {…} [elsif …]* [else …] —— */
  function parseIf(): Node {
    // condition (parentheses optional)
    let condition: Node;
    if (peek()?.type === types.left_paren) {
      advance();
      condition = parseBinaryExpression();
      expect(types.right_paren);
    } else {
      condition = parseBinaryExpression();
    }

    // then‑block
    expect(types.left_brace);
    const thenBranch: Node[] = [];
    while (
      peek()?.type !== types.right_paren &&
      peek()?.type !== types.right_brace
    ) {
      thenBranch.push(parseStatement());
    }
    expect(types.right_brace);

    const elseIfs: ElseIfClause[] = [];
    while (peek()?.type === types.elif) {
      advance();
      let ec: Node;
      if (peek()?.type === types.left_paren) {
        advance();
        ec = parseBinaryExpression();
        expect(types.right_paren);
      } else {
        ec = parseBinaryExpression();
      }
      // block
      expect(types.left_brace);
      const eb: Node[] = [];
      while (peek()?.type !== types.right_brace) {
        eb.push(parseStatement());
      }
      expect(types.right_brace);
      elseIfs.push({ condition: ec, body: eb });
    }

    let elseBranch: Node[] | undefined;
    if (peek()?.type === types.else) {
      advance();
      expect(types.left_brace);
      elseBranch = [];
      while (peek()?.type !== types.right_brace) {
        elseBranch.push(parseStatement());
      }
      expect(types.right_brace);
    }

    return {
      identifier: Statements.IfStatement,
      value: { condition, thenBranch, elseIfs, elseBranch } as IfStatementValue,
    };
  }

  /* -- parseFor: for(…) {…} */
  function parseFor(): Node {
    expect(types.left_paren);

    let init: Node;
    if (peek()?.type === types.def) {
      advance();
      init = parseVariableDeclarationAndAssignment(
        Statements.DeclarationStatement
      );
    } else {
      init = parseVariableDeclarationAndAssignment(
        Statements.AssignmentStatement
      );
    }

    const condition = parseBinaryExpression();
    expect(types.semi);

    let update: Node;
    if (
      (peek()?.type === types.alpha || peek()?.type === types.alphanum) &&
      tokens[cur + 1]?.type === types.assign
    ) {
      const idTk = expect(
        peek()!.type === types.alphanum ? types.alphanum : types.alpha
      );
      expect(types.assign);
      const rhs = parseBinaryExpression();
      update = {
        identifier: Statements.AssignmentStatement,
        value: {
          identifier: idTk.value!,
          value: rhs,
        } as DeclarationStatementValue,
      };
    } else {
      update = parseBinaryExpression();
    }
    expect(types.right_paren);

    expect(types.left_brace);
    const body: Node[] = [];
    while (peek()?.type !== types.right_brace) {
      body.push(parseStatement());
    }
    expect(types.right_brace);

    return {
      identifier: Statements.ForStatement,
      value: { init, condition, update, body } as ForStatementValue,
    };
  }

  /* —— parseReturn: ret <expr>; —— */
  function parseReturn(): Node {
    const expr = parseBinaryExpression();
    expect(types.semi);
    return { identifier: Statements.ReturnStatement, value: expr };
  }

  /* —— Factory for write / writeln —— */
  function makeWriteParser(
    kind: Statements.WriteStatement | Statements.WriteLineStatement
  ) {
    return function parseWriteX(): Node {
      expect(types.left_paren);
      let payload: WriteStatementValue;
      if (peek()?.type === types.str_dec) {
        advance();
        const s = expect(types.str);
        expect(types.str_dec);
        payload = { text: s.value! };
      } else {
        payload = { expr: parseBinaryExpression() };
      }
      expect(types.right_paren);
      expect(types.semi);
      return { identifier: kind, value: payload };
    };
  }
  const parseWrite = makeWriteParser(Statements.WriteStatement);
  const parseWriteLine = makeWriteParser(Statements.WriteLineStatement);

  /* —— Top‑Level Loop —— */
  const ast: Node[] = [];
  while (cur < tokens.length) {
    skipComments();
    if (!peek()) break;
    ast.push(parseStatement());
  }
  return ast;
}
