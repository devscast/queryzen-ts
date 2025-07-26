import { AbstractPlatform } from "@/platforms/abstract-platform";
import { MySQLPlatform } from "@/platforms/mysql-platform";
import { CompositeExpression } from "@/query/expression/composite-expression";

export class ExpressionBuilder {
  static readonly EQ = "=";
  static readonly NEQ = "<>";
  static readonly LT = "<";
  static readonly LTE = "<=";
  static readonly GT = ">";
  static readonly GTE = ">=";

  constructor(private readonly platform: AbstractPlatform = new MySQLPlatform()) {}

  /**
   * Creates a conjunction of the given expressions.
   */
  and(expr: string | CompositeExpression, ...rest: (string | CompositeExpression)[]): CompositeExpression {
    return CompositeExpression.and(expr, ...rest);
  }

  /**
   * Creates a disjunction of the given expressions.
   */
  or(expr: string | CompositeExpression, ...rest: (string | CompositeExpression)[]): CompositeExpression {
    return CompositeExpression.or(expr, ...rest);
  }

  /**
   * Creates a comparison expression with the given arguments.
   */
  comparison(x: string, operator: string, y: string): string {
    return `${x} ${operator} ${y}`;
  }

  /**
   * Creates an equal comparison expression with the given arguments.
   * First argument is considered the left expression and the second is the right expression.
   * When converted to string, it will generate a <left expr> = <right expr>.
   */
  eq(x: string, y: string): string {
    return this.comparison(x, ExpressionBuilder.EQ, y);
  }

  /**
   * Creates a not-equal comparison expression with the given arguments.
   * First argument is considered the left expression and the second is the right expression.
   * When converted to string, it will generate a <left expr> <> <right expr>.
   */
  neq(x: string, y: string): string {
    return this.comparison(x, ExpressionBuilder.NEQ, y);
  }

  /**
   * Creates a lower-than comparison expression with the given arguments.
   * First argument is considered the left expression and the second is the right expression.
   * When converted to string, it will generate a <left expr> < <right expr>.
   */
  lt(x: string, y: string): string {
    return this.comparison(x, ExpressionBuilder.LT, y);
  }

  /**
   * Creates a lower-than-equal comparison expression with the given arguments.
   * First argument is considered the left expression and the second is the right expression.
   * When converted to string, it will generate a <left expr> <= <right expr>.
   */
  lte(x: string, y: string): string {
    return this.comparison(x, ExpressionBuilder.LTE, y);
  }

  /**
   * Creates a greater-than comparison expression with the given arguments.
   * First argument is considered the left expression and the second is the right expression.
   * When converted to string, it will generate a <left expr> > <right expr>.
   */
  gt(x: string, y: string): string {
    return this.comparison(x, ExpressionBuilder.GT, y);
  }

  /**
   * Creates a greater-than-equal comparison expression with the given arguments.
   * First argument is considered the left expression and the second is the right expression.
   * When converted to string, it will generate a <left expr> >= <right expr>.
   */
  gte(x: string, y: string): string {
    return this.comparison(x, ExpressionBuilder.GTE, y);
  }

  /**
   * Creates an IS NULL expression with the given arguments.
   *
   * @param x The expression to be restricted by IS NULL.
   */
  isNull(x: string): string {
    return `${x} IS NULL`;
  }

  /**
   * Creates an IS NOT NULL expression with the given arguments.
   *
   * @param x The expression to be restricted by IS NOT NULL.
   */
  isNotNull(x: string): string {
    return `${x} IS NOT NULL`;
  }

  /**
   * Creates a LIKE comparison expression
   *
   * @param expr The expression to be inspected by the LIKE comparison
   * @param pattern The pattern to compare against
   * @param escapeChar Optional escape character for special characters in the pattern.
   */
  like(expr: string, pattern: string, escapeChar?: string): string {
    return this.comparison(expr, "LIKE", pattern) + (escapeChar ? ` ESCAPE ${escapeChar}` : "");
  }

  /**
   * Creates a NOT LIKE comparison expression
   *
   * @param expr The expression to be inspected by the NOT LIKE comparison
   * @param pattern The pattern to compare against
   * @param escapeChar Optional escape character for special characters in the pattern.
   */
  notLike(expr: string, pattern: string, escapeChar?: string): string {
    return this.comparison(expr, "NOT LIKE", pattern) + (escapeChar ? ` ESCAPE ${escapeChar}` : "");
  }

  /**
   * Creates an IN () comparison expression with the given arguments.
   *
   * @param x The SQL expression to be matched against the set.
   * @param y The SQL expression or an array of SQL expressions representing the set.
   */
  in(x: string, y: string | string[]): string {
    const values = Array.isArray(y) ? y : [y];
    return this.comparison(x, "IN", `(${values.join(", ")})`);
  }

  /**
   * Creates a NOT IN () comparison expression with the given arguments.
   *
   * @param x The SQL expression to be matched against the set.
   * @param y The SQL expression or an array of SQL expressions representing the set.
   */
  notIn(x: string, y: string | string[]): string {
    const values = Array.isArray(y) ? y : [y];
    return this.comparison(x, "NOT IN", `(${values.join(", ")})`);
  }

  /**
   * Creates an SQL literal expression from the string.
   *
   * The usage of this method is discouraged. Use prepared statements
   */
  literal(input: string): string {
    return this.platform.quoteStringLiteral(input);
  }
}
