import { types } from "../extra/enums.js";
import { Token } from "../extra/types.js";

/** --------------------------------------------------------------------------
 * Return an array of tokens from the file.
 * -------------------------------------------------------------------------- */
export default function lex(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  const peek = (n = 0) => input[i + n];
  const advance = () => input[i++];

  const isAlpha = (ch: string) => /[a-zA-Z_]/.test(ch);
  const isAlphanumeric = (ch: string) => /[a-zA-Z0-9_]/.test(ch);
  const isDigit = (ch: string) => /[0-9]/.test(ch);

  const keywords = {
    ret: types.ret,
    write: types.write,
    writeln: types.writeln,
    def: types.def,
    if: types.if,
    elif: types.elif,
    else: types.else,
    for: types.for,
  };

  const singleCharMap: Record<string, Token> = {
    "(": { type: types.left_paren },
    ")": { type: types.right_paren },
    "{": { type: types.left_brace },
    "}": { type: types.right_brace },
    "=": { type: types.assign },
    ">": { type: types.comparison_ops, value: ">" },
    "<": { type: types.comparison_ops, value: "<" },
    ";": { type: types.semi },
  };

  while (i < input.length) {
    const ch = peek();

    /* ---- Skip whitespace ---- */
    if (/\s/.test(ch)) {
      advance();
      continue;
    }

    /* ---- Comparison operators (2-char): <=, >=, ==, != ---- */
    const twoChar = peek() + peek(1);
    if (["<=", ">=", "==", "!="].includes(twoChar)) {
      tokens.push({ type: types.comparison_ops, value: twoChar });
      i += 2;
      continue;
    }

    /* ---- String literal: "..." ---- */
    if (ch === '"') {
      advance();
      let value = "";
      while (i < input.length && peek() !== '"') value += advance();
      if (peek() !== '"') throw new Error("Unterminated string literal");
      advance();
      tokens.push({ type: types.str_dec });
      tokens.push({ type: types.str, value });
      tokens.push({ type: types.str_dec });
      continue;
    }

    /* ---- Comment: @... ---- */
    if (ch === "@") {
      advance();
      let value = "";
      while (i < input.length && peek() !== "\n") value += advance();
      tokens.push({ type: types.comment, value });
      continue;
    }

    /* ---- Identifiers & Keywords ---- */
    if (isAlpha(ch)) {
      let word = "";
      while (i < input.length && isAlphanumeric(peek())) word += advance();

      if (keywords[word as keyof typeof keywords]) {
        tokens.push({ type: keywords[word as keyof typeof keywords] });
      } else {
        tokens.push({
          type: /^[0-9]+$/.test(word)
            ? types.numeric
            : /^[a-zA-Z_]+$/.test(word)
            ? types.alpha
            : types.alphanum,
          value: word,
        });
      }
      continue;
    }

    /* ---- Numeric literals ---- */
    if (isDigit(ch)) {
      let num = "";
      while (i < input.length && isDigit(peek())) num += advance();
      tokens.push({ type: types.numeric, value: num });
      continue;
    }

    /* ---- Binary operators ---- */
    if ("+-*/%^".includes(ch)) {
      tokens.push({ type: types.binary_ops, value: ch });
      advance();
      continue;
    }

    /* --- Single-character tokens ---- */
    if (ch in singleCharMap) {
      tokens.push(singleCharMap[ch]);
      advance();
      continue;
    }

    /* ---- Unknown character ---- */
    throw new Error(`Unexpected character: ${ch}`);
  }

  return tokens;
}
