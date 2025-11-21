export class Limit {
  constructor(
    public readonly maxResults: number | null,
    public readonly firstResult: number = 0,
  ) {}

  isDefined(): boolean {
    return this.maxResults !== null || this.firstResult !== 0;
  }

  getMaxResults(): number | null {
    return this.maxResults;
  }

  getFirstResult(): number {
    return this.firstResult;
  }
}
