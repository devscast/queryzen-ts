import { AbstractPlatform } from "@/platforms/abstract-platform";

export class OraclePlatform extends AbstractPlatform {
  protected doModifyLimitQuery(query: string, limit: number | null, offset: number): string {
    if (offset > 0) {
      query += ` OFFSET ${offset} ROWS`;
    }

    if (limit !== null) {
      query += ` FETCH NEXT ${limit} ROWS ONLY`;
    }

    return query;
  }
}
