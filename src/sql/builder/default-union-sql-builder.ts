import { AbstractPlatform } from "../../platforms/abstract-platform";
import { UnionQuery } from "../../query/union-query";
import { UnionType } from "../../query/union-type";
import { UnionSQLBuilder } from "./union-sql-builder";

export class DefaultUnionSQLBuilder implements UnionSQLBuilder {
  constructor(private readonly platform: AbstractPlatform) {}

  buildSQL(query: UnionQuery): string {
    const parts: string[] = [];

    for (const union of query.unionParts) {
      if (union.type !== null) {
        parts.push(
          union.type === UnionType.ALL
            ? this.platform.getUnionAllSQL()
            : this.platform.getUnionDistinctSQL(),
        );
      }

      parts.push(this.platform.getUnionSelectPartSQL(String(union.query)));
    }

    const orderBy = query.orderBy;
    if (orderBy.length > 0) {
      parts.push(`ORDER BY ${orderBy.join(", ")}`);
    }

    let sql = parts.join(" ");

    const limit = query.limit;
    if (limit.isDefined()) {
      sql = this.platform.modifyLimitQuery(sql, limit.getMaxResults(), limit.getFirstResult());
    }

    return sql;
  }
}
