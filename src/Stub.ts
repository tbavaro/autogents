export type Stubbable = object;

export type Stub<T extends Stubbable> = T & {
  // will be specified name or "<generic stub>" until this is assigned
  __stubName?: string
};

export function createStub<T extends Stubbable>(name?: string): Stub<T> {
  return { __stubName: name || "<generic stub>" } as any;
}

export function assign<T extends Stubbable>(
  stub: Stub<T>,
  replacement: T
): T {
  if (!isUnassignedStub(stub)) {
    throw new Error("stub has already been assigned");
  }
  delete stub.__stubName;
  Object.assign(stub, replacement);
  Object.setPrototypeOf(stub, Object.getPrototypeOf(replacement));
  return stub;
}

export function isUnassignedStub(object: Stubbable) {
  return ((object as Stub<any>).__stubName !== undefined);
}
