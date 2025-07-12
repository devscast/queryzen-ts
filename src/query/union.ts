import { QueryBuilder } from "@/query/query-builder";
import { UnionType } from "@/query/union-type";

export class Union {
  constructor(
    public readonly query: QueryBuilder | string,
    public readonly type: UnionType | null = null
  ) {}
}
