import { ForUpdate } from "@/query/for-update";
import { Limit } from "@/query/limit";

export class SelectQuery {
  constructor(
    public readonly distinct: boolean,
    public readonly columns: string[],
    public readonly from: string[],
    public readonly where: string | null,
    public readonly groupBy: string[],
    public readonly having: string | null,
    public readonly orderBy: string[],
    public readonly limit: Limit,
    public readonly forUpdate: ForUpdate | null
  ) {}
}
