export type Foo = {
  aString: string;
  anOptionalString?: string;
  aStringOrUndefined: string | undefined;
  aStringOrNull: string | null;
  aNumber: number;
};

export interface IBar {
  c: string;
  d: string;
}

type InternalFoo = {
  d: number;
}

// export type NumberAlias = number;
