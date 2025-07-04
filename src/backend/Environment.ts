type alphanum = string | number;

export default class Env {
  private variables: Map<string, alphanum>;
  private functions: Map<string, string>;

  constructor() {
    this.variables = new Map();
    this.functions = new Map();
  }

  declareVar(name: string, val: alphanum) {
    // if (this.variables.has(name))
    //   throw new Error(`Redefining variable: ${name}`);
    this.variables.set(name, val);
  }

  assignVar(name: string, val: alphanum) {
    if (!this.variables.has(name))
      throw new Error(`Assignment to an undefined variable: ${name}`);
    this.variables.set(name, val);
  }

  getVar(name: string) {
    try {
      return this.variables.get(name);
    } catch {
      throw Error(`Unknown variable: ${name}`);
    }
  }

  hasVar(name: string) {
    return this.variables.has(name);
  }

  allVariables() {
    return this.variables.entries();
  }
}
