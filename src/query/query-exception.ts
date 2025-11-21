import { Exception } from "../exception";

export class QueryException extends Error implements Exception {
  constructor(message: string) {
    super(message);
    this.name = "QueryException";
    Object.setPrototypeOf(this, QueryException.prototype); // Fix prototype chain
  }
}
