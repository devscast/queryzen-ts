export enum ConflictResolutionMode {
  ORDINARY,
  SKIP_LOCKED,
}

export class ForUpdate {
  constructor(public readonly conflictResolutionMode: ConflictResolutionMode) {}
}
