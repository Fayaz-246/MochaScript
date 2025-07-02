import { types } from "../extra/enums.js";
import { Token } from "../extra/types.js";

/**
 * Lex the input string into an array of Tokens.
 */
export function lex(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    /* ----- Skip whitespace ---- */
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    /* ----- <= >= != == ----- */
    const two = input.slice(i, i + 2);
    if (two === ">=" || two === "<=" || two === "==" || two === "!=") {
      tokens.push({ type: types.comparison_ops, value: two });
      i += 2;
      continue;
    }

    /* ----- String literal: "…content…" ----- */
    if (ch === '"') {
      i++;
      let value = "";
      while (i < input.length && input[i] !== '"') {
        value += input[i++];
      }
      if (input[i] !== '"') {
        throw new Error("Unterminated string literal");
      }
      i++;
      tokens.push({ type: types.str_dec });
      tokens.push({ type: types.str, value });
      tokens.push({ type: types.str_dec });
      continue;
    }

    /* ----- Comment: @…newline ----- */
    if (ch === "@") {
      i++;
      let value = "";
      while (i < input.length && input[i] !== "\n") {
        value += input[i++];
      }
      tokens.push({ type: types.comment, value });
      continue;
    }

    /* ----- Identifiers & Keywords: [A-Za-z_][A-Za-z0-9_]* ----- */
    if (/[a-zA-Z_]/.test(ch)) {
      let word = "";
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
        word += input[i++];
      }

      switch (word) {
        case "ret":
          tokens.push({ type: types.ret });
          break;
        case "write":
          tokens.push({ type: types.write });
          break;
        case "writeln":
          tokens.push({ type: types.writeln });
          break;
        case "def":
          tokens.push({ type: types.def });
          break;
        case "if":
          tokens.push({ type: types.if });
          break;
        case "elif":
          tokens.push({ type: types.elif });
          break;
        case "else":
          tokens.push({ type: types.else });
          break;
        case "for":
          tokens.push({ type: types.for });
          break;
        default:
          // Mixed alphanumeric variables
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

    /* ----- Number literal: 0–9+ ----- */
    if (/[0-9]/.test(ch)) {
      let num = "";
      while (i < input.length && /[0-9]/.test(input[i])) {
        num += input[i++];
      }
      tokens.push({ type: types.numeric, value: num });
      continue;
    }

    /* ----- Operators: + - * / % ^ ----- */
    if ("+-*/%^".includes(ch)) {
      tokens.push({ type: types.binary_ops, value: ch });
      i++;
      continue;
    }

    /* ----- Single‑char tokens ----- */
    switch (ch) {
      case "(":
        tokens.push({ type: types.left_paren });
        i++;
        continue;
      case ")":
        tokens.push({ type: types.right_paren });
        i++;
        continue;
      case "{":
        tokens.push({ type: types.left_brace });
        i++;
        continue;
      case "}":
        tokens.push({ type: types.right_brace });
        i++;
        continue;
      case "=":
        tokens.push({ type: types.assign });
        i++;
        continue;
      case ">":
      case "<":
        tokens.push({ type: types.comparison_ops, value: ch });
        i++;
        continue;
      case ";":
        tokens.push({ type: types.semi });
        i++;
        continue;
    }

    /* ----- Unexpected character ----- */
    throw new Error(`Unexpected character: ${ch}`);
  }

  return tokens;
}
