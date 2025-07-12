import { CompositeExpression } from "@/query/expression/composite-expression";

export class ExpressionBuilder {
  static readonly EQ = "=";
  static readonly NEQ = "<>";
  static readonly LT = "<";
  static readonly LTE = "<=";
  static readonly GT = ">";
  static readonly GTE = ">=";

  and(expr: string | CompositeExpression, ...rest: (string | CompositeExpression)[]): CompositeExpression {
    return CompositeExpression.and(expr, ...rest);
  }

  or(expr: string | CompositeExpression, ...rest: (string | CompositeExpression)[]): CompositeExpression {
    return CompositeExpression.or(expr, ...rest);
  }

  comparison(x: string, operator: string, y: string): string {
    return `${x} ${operator} ${y}`;
  }

  eq(x: string, y: string): string {
    return this.comparison(x, ExpressionBuilder.EQ, y);
  }

  neq(x: string, y: string): string {
    return this.comparison(x, ExpressionBuilder.NEQ, y);
  }

  lt(x: string, y: string): string {
    return this.comparison(x, ExpressionBuilder.LT, y);
  }

  lte(x: string, y: string): string {
    return this.comparison(x, ExpressionBuilder.LTE, y);
  }

  gt(x: string, y: string): string {
    return this.comparison(x, ExpressionBuilder.GT, y);
  }

  gte(x: string, y: string): string {
    return this.comparison(x, ExpressionBuilder.GTE, y);
  }

  isNull(x: string): string {
    return `${x} IS NULL`;
  }

  isNotNull(x: string): string {
    return `${x} IS NOT NULL`;
  }

  like(expr: string, pattern: string, escapeChar?: string): string {
    return this.comparison(expr, "LIKE", pattern) + (escapeChar ? ` ESCAPE ${escapeChar}` : "");
  }

  notLike(expr: string, pattern: string, escapeChar?: string): string {
    return this.comparison(expr, "NOT LIKE", pattern) + (escapeChar ? ` ESCAPE ${escapeChar}` : "");
  }

  in(x: string, y: string | string[]): string {
    const values = Array.isArray(y) ? y : [y];
    return this.comparison(x, "IN", `(${values.join(", ")})`);
  }

  notIn(x: string, y: string | string[]): string {
    const values = Array.isArray(y) ? y : [y];
    return this.comparison(x, "NOT IN", `(${values.join(", ")})`);
  }
}
