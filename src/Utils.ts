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
