export function transformPOJOValues<V1, V2>(
  input: { [key: string]: V1 },
  transform: (value: V1, key: string) => V2
): { [key: string]: V2 } {
  const output: { [key: string]: V2 } = {};
  Object.entries(input).forEach(([k, v]) => {
    output[k] = transform(v, k);
  });
  return output;
}

export function transformMapValues<K, V1, V2>(
  input: Map<K, V1>,
  transform: (value: V1, key: K) => V2
): Map<K, V2> {
  const output = new Map<K, V2>();
  for (const [key, value] of input.entries()) {
    output.set(key, transform(value, key));
  }
  return output;
}

export function mapToPOJO<V>(
  input: Map<string, V>
): { [key: string]: V } {
  const output: { [key: string]: V } = {};
  for (const [key, value] of input.entries()) {
    output[key] = value;
  }
  return output;
}

export function pushAll<V>(array: V[], values: Iterable<V>) {
  for (const v of values) {
    array.push(v);
  }
}

export function addAll<V>(target: Set<V>, values: Iterable<V>) {
  for (const v of values) {
    target.add(v);
  }
}

export function transformSetValues<V1, V2>(
  input: Set<V1>,
  transform: (value: V1) => V2,
  allowCollisions?: boolean
): Set<V2> {
  const output = new Set<V2>();
  for (const value of input) {
    const newValue = transform(value);
    if (!allowCollisions && output.has(newValue)) {
      throw new Error("collision during set transform: " + newValue);
    }
    output.add(newValue);
  }
  return output;
}

export function assertDefined<T>(value: T | undefined): T {
  if (value === undefined) {
    throw new Error("unexpected undefined");
  }
  return value;
}
