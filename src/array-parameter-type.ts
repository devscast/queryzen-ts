import { ParameterType } from "@/parameter-type";

export enum ArrayParameterType {
  INTEGER = "INTEGER",
  STRING = "STRING",
  ASCII = "ASCII",
  BINARY = "BINARY",
}

export namespace ArrayParameterType {
  /**
   * Maps ArrayParameterType to corresponding ParameterType.
   */
  export function toElementParameterType(type: ArrayParameterType): ParameterType {
    switch (type) {
      case ArrayParameterType.INTEGER:
        return ParameterType.INTEGER;
      case ArrayParameterType.STRING:
        return ParameterType.STRING;
      case ArrayParameterType.ASCII:
        return ParameterType.ASCII;
      case ArrayParameterType.BINARY:
        return ParameterType.BINARY;
    }
  }
}
