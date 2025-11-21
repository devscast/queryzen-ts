import { QueryException } from "../query-exception";

export class NonUniqueAlias extends QueryException {
  static new(alias: string, registeredAliases: string[]): NonUniqueAlias {
    const message =
      `The given alias "${alias}" is not unique in FROM and JOIN clause table. ` +
      `The currently registered aliases are: ${registeredAliases.join(", ")}.`;

    return new NonUniqueAlias(message);
  }
}
