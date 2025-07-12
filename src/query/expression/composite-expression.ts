export class CompositeExpression {
  static readonly TYPE_AND = "AND";
  static readonly TYPE_OR = "OR";

  private readonly parts: (CompositeExpression | string)[];

  constructor(
    private readonly type: "AND" | "OR",
    part: CompositeExpression | string,
    ...rest: (CompositeExpression | string)[]
  ) {
    this.parts = [part, ...rest];
  }

  static and(part: CompositeExpression | string, ...parts: (CompositeExpression | string)[]): CompositeExpression {
    return new CompositeExpression("AND", part, ...parts);
  }

  static or(part: CompositeExpression | string, ...parts: (CompositeExpression | string)[]): CompositeExpression {
    return new CompositeExpression("OR", part, ...parts);
  }

  with(part: CompositeExpression | string, ...parts: (CompositeExpression | string)[]): CompositeExpression {
    const newParts = [...this.parts, part, ...parts];
    const copy = new CompositeExpression(this.type, newParts[0]);
    copy.parts.splice(1, 0, ...newParts.slice(1)); // maintain original order
    return copy;
  }

  getType(): "AND" | "OR" {
    return this.type;
  }

  count(): number {
    return this.parts.length;
  }

  toString(): string {
    if (this.parts.length === 1) {
      return String(this.parts[0]);
    }
    return `(${this.parts.map(String).join(`) ${this.type} (`)})`;
  }
}
