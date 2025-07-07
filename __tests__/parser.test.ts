import Parser from "../src/lang/parse";
import { formatAst } from "../src/extra/formatters";
import { Statements } from "../src/extra/enums";

describe("Parser → AST", () => {
  function astStrings(src: string) {
    const p = new Parser(src);
    return formatAst(p.getAST()).split("\n");
  }

  it("recognizes declaration and assignment", () => {
    const lines = astStrings("def x = 5; x = 6;");
    expect(lines.some((l) => l.includes("DeclarationStatement"))).toBe(true);
    expect(lines.some((l) => l.includes("AssignmentStatement"))).toBe(true);
  });

  it("parses if/elif/else", () => {
    const ast = astStrings(`
      if a>0 { write("hi"); }
      elif a==0 { write("zero"); }
      else { write("bye"); }
    `).join(" ");
    expect(ast).toMatch(/IfStatement/);
    expect(ast).toMatch(/WriteStr\("hi"\)/);
    expect(ast).toMatch(/WriteStr\("zero"\)/);
    expect(ast).toMatch(/WriteStr\("bye"\)/);
  });
});
