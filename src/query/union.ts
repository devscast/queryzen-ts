import { QueryBuilder } from "./query-builder";
import { UnionType } from "./union-type";

export class Union {
  constructor(
    public readonly query: QueryBuilder | string,
    public readonly type: UnionType | null = null,
  ) {}
}
