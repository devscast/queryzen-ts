import { Limit } from "@/query/limit";
import { Union } from "@/query/union";

export class UnionQuery {
  constructor(
    public readonly unionParts: Union[],
    public readonly orderBy: string[],
    public readonly limit: Limit
  ) {}
}
