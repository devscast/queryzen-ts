import { CommonTableExpression } from "../../query/common-table-expression";

export class WithSQLBuilder {
  public buildSQL(
    firstExpression: CommonTableExpression,
    ...otherExpressions: CommonTableExpression[]
  ): string {
    const cteParts: string[] = [];

    for (const part of [firstExpression, ...otherExpressions]) {
      const ctePart: string[] = [part.name];
      if (part.columns && part.columns.length > 0) {
        ctePart.push(` (${part.columns.join(", ")})`);
      }
      ctePart.push(` AS (${part.query})`);
      cteParts.push(ctePart.join(""));
    }

    return `WITH ${cteParts.join(", ")}`;
  }
}
