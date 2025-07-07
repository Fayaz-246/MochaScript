import lex from "../src/lang/lexer";
import { types } from "../src/extra/enums";

describe("Lexer", () => {
  it("lexes simple def and mut", () => {
    const tokens = lex("def a = 1; mut b = 2;");
    const ty = tokens.map((t) => t.type);
    expect(ty).toEqual([
      types.def,
      types.alpha,
      types.assign,
      types.numeric,
      types.semi,
      types.mut,
      types.alpha,
      types.assign,
      types.numeric,
      types.semi,
    ]);
  });

  it("lexes comparison operators", () => {
    const ops = lex("a<=b==c!=d").filter(
      (t) => t.type === types.comparison_ops,
    );
    expect(ops.map((t) => t.value)).toEqual(["<=", "==", "!="]);
  });
});
