import { QueryException } from "../query-exception";

export class UnknownAlias extends QueryException {
  static new(alias: string, registeredAliases: string[]): UnknownAlias {
    const message =
      `The given alias "${alias}" is not part of any FROM or JOIN clause table. ` +
      `The currently registered aliases are: ${registeredAliases.join(", ")}.`;

    return new UnknownAlias(message);
  }
}
