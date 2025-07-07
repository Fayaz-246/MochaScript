import Parser from "../src/lang/parse";
import { interpret } from "../src/lang/interpret";
import Env from "../src/backend/Environment";

describe("Interpreter (end‑to‑end)", () => {
  let env: Env;
  let output: string[];

  beforeEach(() => {
    env = new Env();
    output = [];
    jest.spyOn(process.stdout, "write").mockImplementation((s: string) => {
      output.push(s);
      return true;
    });
  });
  afterEach(() => {
    (process.stdout.write as jest.Mock).mockRestore();
  });

  function run(src: string) {
    const ast = new Parser(src).getAST();
    interpret(ast, env);
  }

  it("handles write and writeln", () => {
    run(`write("X"); writeln("Y");`);
    expect(output.join("")).toBe("XY\n");
  });

  it("evaluates expressions and comparisons", () => {
    run(`
      def x = 4; mut y = 2;
      write(x + y * 3); write(" ");
      write(x > y); write(" "); write(x == 4);
    `);
    expect(output.join("")).toBe("10 1 1");
  });

  it("exits with return code", () => {
    const spy = jest
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw code;
      });
    expect(() => run(`ret 7;`)).toThrow(7);
    spy.mockRestore();
  });
});
