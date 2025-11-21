import { PlatformException } from "../exception/platform-exception";

export class NotSupported extends Error implements PlatformException {
  constructor(method: string) {
    super(`Operation "${method}" is not supported by platform.`);
    this.name = "NotSupported";
    Object.setPrototypeOf(this, NotSupported.prototype); // Fix prototype chain
  }

  static new(method: string): NotSupported {
    return new NotSupported(method);
  }
}
