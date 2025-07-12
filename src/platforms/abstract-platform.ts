import { DefaultSelectSQLBuilder } from "@/sql/builder/default-select-sql-builder";
import { DefaultUnionSQLBuilder } from "@/sql/builder/default-union-sql-builder";
import { SelectSQLBuilder } from "@/sql/builder/select-sql-builder";
import { UnionSQLBuilder } from "@/sql/builder/union-sql-builder";
import { WithSQLBuilder } from "@/sql/builder/with-sql-builder";

export abstract class AbstractPlatform {
  /**
   * Quotes a single identifier (no dot chain separation).
   */
  public quoteSingleIdentifier(str: string): string {
    return `"${str.replace(/"/g, `""`)}"`;
  }

  /**
   * Adds a driver-specific LIMIT clause to the query.
   */
  public modifyLimitQuery(query: string, limit: number | null, offset: number = 0): string {
    if (offset < 0) {
      throw new Error(`Offset must be a positive integer or zero, ${offset} given.`);
    }

    return this.doModifyLimitQuery(query, limit, offset);
  }

  /**
   * Adds a platform-specific LIMIT clause to the query.
   */
  protected doModifyLimitQuery(query: string, limit: number | null, offset: number): string {
    if (limit !== null) {
      query += ` LIMIT ${limit}`;
    }

    if (offset > 0) {
      query += ` OFFSET ${offset}`;
    }

    return query;
  }

  /**
   * Quotes a literal string.
   * This method is NOT meant to fix SQL injections!
   * It is only meant to escape this platform's string literal
   * quote character inside the given literal string.
   */
  public quoteStringLiteral(str: string): string {
    return `'${str.replace(/'/g, `''`)}'`;
  }

  public getUnionSelectPartSQL(subQuery: string): string {
    return `(${subQuery})`;
  }

  /**
   * Returns the `UNION ALL` keyword.
   */
  public getUnionAllSQL(): string {
    return "UNION ALL";
  }

  /**
   * Returns the compatible `UNION DISTINCT` keyword.
   */
  public getUnionDistinctSQL(): string {
    return "UNION";
  }

  public createSelectSQLBuilder(): SelectSQLBuilder {
    return new DefaultSelectSQLBuilder(this, "FOR UPDATE", "SKIP LOCKED");
  }

  public createUnionSQLBuilder(): UnionSQLBuilder {
    return new DefaultUnionSQLBuilder(this);
  }

  public createWithSQLBuilder(): WithSQLBuilder {
    return new WithSQLBuilder();
  }
}
