export type Foo = {
  aString: string;
  anOptionalString?: string;
  aStringOrUndefined: string | undefined;
  aStringOrNull: string | null;
  aNumber: number;
  anOptionalStringOrNumberOrNull?: string | number | null;
};

export interface IBar {
  c: string;
  d: string;
  foo: Foo;
}

type InternalFoo = {
  d: number;
}

// export type NumberAlias = number;
