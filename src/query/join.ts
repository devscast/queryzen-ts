export class Join {
  private constructor(
    public readonly type: "INNER" | "LEFT" | "RIGHT",
    public readonly table: string,
    public readonly alias: string,
    public readonly condition: string | null,
  ) {}

  static inner(table: string, alias: string, condition: string | null): Join {
    return new Join("INNER", table, alias, condition);
  }

  static left(table: string, alias: string, condition: string | null): Join {
    return new Join("LEFT", table, alias, condition);
  }

  static right(table: string, alias: string, condition: string | null): Join {
    return new Join("RIGHT", table, alias, condition);
  }
}
