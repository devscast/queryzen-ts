import { UnionQuery } from "../../query/union-query";

export interface UnionSQLBuilder {
  buildSQL(query: UnionQuery): string;
}
