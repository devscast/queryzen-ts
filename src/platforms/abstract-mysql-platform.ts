import { AbstractPlatform } from "./abstract-platform";

export abstract class AbstractMySQLPlatform extends AbstractPlatform {
  protected doModifyLimitQuery(query: string, limit: number | null, offset: number): string {
    if (limit !== null) {
      query += ` LIMIT ${limit}`;

      if (offset > 0) {
        query += ` OFFSET ${offset}`;
      }
    } else if (offset > 0) {
      // 2^64-1 is the maximum of unsigned BIGINT, the biggest limit possible
      query += ` LIMIT 18446744073709551615 OFFSET ${offset}`;
    }

    return query;
  }

  public quoteSingleIdentifier(str: string): string {
    return `\`${str.replace(/`/g, "``")}\``;
  }
}
