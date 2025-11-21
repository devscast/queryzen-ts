export class From {
  constructor(
    public readonly table: string,
    public readonly alias: string | null = null,
  ) {}
}
