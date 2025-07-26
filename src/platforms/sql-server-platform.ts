import { AbstractPlatform } from "@/platforms/abstract-platform";

export abstract class SQLServerPlatform extends AbstractPlatform {
  protected doModifyLimitQuery(query: string, limit: number | null, offset: number): string {
    if (limit === null && offset <= 0) {
      return query;
    }

    if (this.shouldAddOrderBy(query)) {
      if (/^SELECT\s+DISTINCT/im.test(query)) {
        // SQL Server won't let us order by a non-selected column in a DISTINCT query,
        // so we have to do this madness. This says, order by the first column in the
        // result. SQL Server's docs say that a nonordered query's result order is non-
        // deterministic anyway, so this won't do anything that a bunch of update and
        // deletes to the table wouldn't do anyway.
        query += " ORDER BY 1";
      } else {
        // In another DBMS, we could do ORDER BY 0, but SQL Server gets angry if you
        // use constant expressions in the order by list.
        query += " ORDER BY (SELECT 0)";
      }
    }

    // This looks somewhat like MYSQL, but limit/offset are in inverse positions
    // Supposedly SQL:2008 core standard.
    // Per TSQL spec, FETCH NEXT n ROWS ONLY is not valid without OFFSET n ROWS.
    query += ` OFFSET ${offset} ROWS`;

    if (limit !== null) {
      query += ` FETCH NEXT ${limit} ROWS ONLY`;
    }

    return query;
  }

  private shouldAddOrderBy(query: string): boolean {
    // Find the position of the last instance of ORDER BY and ensure it is not within a parenthetical statement
    const matches = [...query.matchAll(/\s+order\s+by\s/gi)];
    if (matches.length === 0) {
      return true;
    }

    // ORDER BY instance may be in a subquery after ORDER BY
    // e.g. SELECT col1 FROM test ORDER BY (SELECT col2 from test ORDER BY col2)
    // if in the searched query ORDER BY clause was found where
    // number of open parentheses after the occurrence of the clause is equal to
    // number of closed brackets after the occurrence of the clause,
    // it means that ORDER BY is included in the query being checked
    for (let i = matches.length - 1; i >= 0; i--) {
      const orderByPos = matches[i]!.index!;
      const openBracketsCount = this.countChar(query, "(", orderByPos);
      const closedBracketsCount = this.countChar(query, ")", orderByPos);

      if (openBracketsCount === closedBracketsCount) {
        return false;
      }
    }

    return true;
  }

  /**
   * Helper function to count occurrences of a character after a given index
   */
  private countChar(input: string, char: string, start: number): number {
    let count = 0;
    for (let i = start; i < input.length; i++) {
      if (input[i] === char) {
        count++;
      }
    }
    return count;
  }

  public quoteSingleIdentifier(str: string): string {
    return "[" + str.replace(/]/g, "]]") + "]";
  }
}
