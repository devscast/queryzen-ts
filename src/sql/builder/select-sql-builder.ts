import { SelectQuery } from "../../query/select-query";

export interface SelectSQLBuilder {
  buildSQL(query: SelectQuery): string;
}
