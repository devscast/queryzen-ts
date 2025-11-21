import { AbstractPlatform } from "../../platforms/abstract-platform";
import { NotSupported } from "../../platforms/exception/not-supported";
import { ConflictResolutionMode } from "../../query/for-update";
import { SelectQuery } from "../../query/select-query";
import { SelectSQLBuilder } from "./select-sql-builder";

export class DefaultSelectSQLBuilder implements SelectSQLBuilder {
  constructor(
    private readonly platform: AbstractPlatform,
    private readonly forUpdateSQL: string | null,
    private readonly skipLockedSQL: string | null,
  ) {}

  buildSQL(query: SelectQuery): string {
    const parts: string[] = ["SELECT"];

    if (query.distinct) {
      parts.push("DISTINCT");
    }

    parts.push(query.columns.join(", "));

    const from = query.from;
    if (from.length > 0) {
      parts.push(`FROM ${from.join(", ")}`);
    }

    const where = query.where;
    if (where !== null) {
      parts.push(`WHERE ${where}`);
    }

    const groupBy = query.groupBy;
    if (groupBy.length > 0) {
      parts.push(`GROUP BY ${groupBy.join(", ")}`);
    }

    const having = query.having;
    if (having !== null) {
      parts.push(`HAVING ${having}`);
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

    const forUpdate = query.forUpdate;
    if (forUpdate !== null) {
      if (this.forUpdateSQL === null) {
        throw NotSupported.new("FOR UPDATE");
      }

      sql += ` ${this.forUpdateSQL}`;

      if (forUpdate.conflictResolutionMode === ConflictResolutionMode.SKIP_LOCKED) {
        if (this.skipLockedSQL === null) {
          throw NotSupported.new("SKIP LOCKED");
        }

        sql += ` ${this.skipLockedSQL}`;
      }
    }

    return sql;
  }
}
