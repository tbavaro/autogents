import * as Stub from "./Stub";

type SelfReferencingPOJOType = {
  next: SelfReferencingPOJOType;
}

it("works on basic objects", () => {
  const stub = Stub.createStub<SelfReferencingPOJOType>();

  const object = {
    next: stub
  };

  expect(Stub.isUnassignedStub(stub)).toBeTruthy();

  const assignedObject = Stub.assign(stub, object);

  expect(assignedObject).toBe(stub);
  expect(Stub.isUnassignedStub(stub)).toBeFalsy();

  expect(assignedObject.next).toBe(assignedObject);
  expect(assignedObject.next.next).toBe(assignedObject);
});

it("works in cycle", () => {
  const stub1 = Stub.createStub<SelfReferencingPOJOType>();
  const stub2 = Stub.createStub<SelfReferencingPOJOType>();

  const object1 = Stub.assign(stub1, { next: stub2 });
  const object2 = Stub.assign(stub2, { next: stub1 });

  expect(object1).not.toBe(object2);
  expect(object1.next).toBe(object2);
  expect(object2.next).toBe(object1);
});

interface IBasicInterface {
  name: string;
}

it("works with interfaces", () => {
  const stub = Stub.createStub<IBasicInterface>();

  expect(Stub.isUnassignedStub(stub)).toBeTruthy();

  const object = Stub.assign(stub, { name: "bar" });

  expect(object).toBe(stub);
  expect(object.name).toBe("bar");
});

class BasicClass {
  public readonly name: string;

  constructor(name: string) {
    this.name = name;
  }
}

it("works with classes", () => {
  const stub = Stub.createStub<BasicClass>();

  // TODO see if we should actually make this work already
  expect(stub).not.toBeInstanceOf(BasicClass);
  expect(Stub.isUnassignedStub(stub)).toBeTruthy();

  const object = Stub.assign(stub, new BasicClass("foo"));

  expect(object).toBe(stub);
  expect(object).toBeInstanceOf(BasicClass);
  expect(object.name).toBe("foo");
});

class SelfReferencingClass {
  public readonly next: SelfReferencingClass;

  constructor(next: SelfReferencingClass) {
    this.next = next;
  }
}

it("self-referencing works with classes", () => {
  const stub = Stub.createStub<SelfReferencingClass>();

  const object = Stub.assign(stub, new SelfReferencingClass(stub));

  expect(object).toBe(stub);
  expect(object).toBeInstanceOf(SelfReferencingClass);
  expect(object.next).toBe(object);
  expect(object.next).toBeInstanceOf(SelfReferencingClass);
});
