import { Limit } from "./limit";
import { Union } from "./union";

export class UnionQuery {
  constructor(
    public readonly unionParts: Union[],
    public readonly orderBy: string[],
    public readonly limit: Limit,
  ) {}
}
