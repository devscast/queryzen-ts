import { QueryBuilder } from "./query-builder";
import { QueryException } from "./query-exception";

export class CommonTableExpression {
  public readonly name: string;
  public readonly query: string | QueryBuilder;
  public readonly columns: string[] | null;

  constructor(name: string, query: string | QueryBuilder, columns: string[] | null) {
    if (columns !== null && columns.length === 0) {
      throw new QueryException(`Columns defined in CTE "${name}" should not be an empty array.`);
    }

    this.name = name;
    this.query = query;
    this.columns = columns;
  }
}
