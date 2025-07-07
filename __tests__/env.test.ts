import Env from "../src/backend/Environment";

describe("Env", () => {
  let env: Env;

  beforeEach(() => {
    env = new Env();
  });

  test("declare and get immutable variable", () => {
    env.declareVar("x", { value: 42 });
    expect(env.getVar("x").value).toBe(42);
  });

  test("cannot reassign immutable variable", () => {
    env.declareVar("y", { value: 1 });
    expect(() => env.assignVar("y", 2)).toThrow(/immutable/);
  });

  test("scoped shadowing", () => {
    env.declareVar("v", { value: "global" });
    env.pushScope();
    env.declareVar("v", { value: "inner" });
    expect(env.getVar("v").value).toBe("inner");
    env.popScope();
    expect(env.getVar("v").value).toBe("global");
  });

  test("function declare & retrieve", () => {
    env.declareFunction("foo", "body");
    expect(env.getFunction("foo")).toBe("body");
    expect(() => env.declareFunction("foo", "other")).toThrow();
  });
});
