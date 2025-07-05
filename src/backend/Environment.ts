export type AlphaNumBool = string | number | boolean;
export interface VariableValue {
  value: AlphaNumBool;
  mutable?: boolean;
}

/**
 * Env manages variable and function definitions with nested scope support.
 */
export default class Env {
  private scopes: Map<string, VariableValue>[];
  private functions: Map<string, string>;

  constructor() {
    // initialize with a global scope
    this.scopes = [new Map()];
    this.functions = new Map();
  }

  /** Enter a new nested scope */
  public pushScope(): void {
    this.scopes.push(new Map());
  }

  /** Exit the current scope */
  public popScope(): void {
    if (this.scopes.length === 1) {
      throw new Error("Cannot pop global scope");
    }
    this.scopes.pop();
  }

  /** Declare a variable in the current scope */
  public declareVar(name: string, val: VariableValue): void {
    const current = this.currentScope();
    if (current.has(name)) {
      throw new Error(`Variable already declared in this scope: ${name}`);
    }
    current.set(name, val);
  }

  /** Assign to an existing variable in nearest containing scope */
  public assignVar(name: string, val: AlphaNumBool): void {
    const scope = this.findScopeWithVar(name);
    if (!scope) {
      throw new Error(`Assignment to an undefined variable: ${name}`);
    }

    const variable = scope.get(name)!;
    if (!variable.mutable) {
      throw new Error(`Cannot assign to immutable variable: ${name}`);
    }

    variable.value = val;
  }

  /** Retrieve variable value by name, searching outward from current scope */
  public getVar(name: string): VariableValue {
    const scope = this.findScopeWithVar(name);
    if (!scope) {
      throw new Error(`Unknown variable: ${name}`);
    }
    return scope.get(name)!;
  }

  /** Check if a variable exists in any active scope */
  public hasVar(name: string): boolean {
    return this.findScopeWithVar(name) !== undefined;
  }

  /** List all variables in current and outer scopes (inner first) */
  public allVariables(): Iterable<[string, VariableValue]> {
    const merged = new Map<string, VariableValue>();
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      for (const [k, v] of this.scopes[i]) {
        if (!merged.has(k)) merged.set(k, v);
      }
    }
    return merged.entries();
  }

  /** Register a function signature or definition */
  public declareFunction(name: string, body: string): void {
    if (this.functions.has(name)) {
      throw new Error(`Function already declared: ${name}`);
    }
    this.functions.set(name, body);
  }

  /** Retrieve a function by name */
  public getFunction(name: string): string {
    const fn = this.functions.get(name);
    if (!fn) {
      throw new Error(`Unknown function: ${name}`);
    }
    return fn;
  }

  /** Helpers */
  private currentScope(): Map<string, VariableValue> {
    return this.scopes[this.scopes.length - 1];
  }

  private findScopeWithVar(
    name: string
  ): Map<string, VariableValue> | undefined {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name)) {
        return this.scopes[i];
      }
    }
    return undefined;
  }
}
