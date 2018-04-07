export declare function transformPOJOValues<V1, V2>(input: {
    [key: string]: V1;
}, transform: (value: V1, key: string) => V2): {
    [key: string]: V2;
};
export declare function transformMapValues<K, V1, V2>(input: Map<K, V1>, transform: (value: V1, key: K) => V2): Map<K, V2>;
export declare function mapToPOJO<V>(input: Map<string, V>): {
    [key: string]: V;
};
export declare function pushAll<V>(array: V[], values: Iterable<V>): void;
export declare function addAll<V>(target: Set<V>, values: Iterable<V>): void;
export declare function transformSetValues<V1, V2>(input: Set<V1>, transform: (value: V1) => V2, allowCollisions?: boolean): Set<V2>;
export declare function assertDefined<T>(value: T | undefined): T;
