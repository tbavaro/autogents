export declare type Stubbable = object;
export declare type Stub<T extends Stubbable> = T & {
    __stubName?: string;
};
export declare function createStub<T extends Stubbable>(name?: string): Stub<T>;
export declare function assign<T extends Stubbable>(stub: Stub<T>, replacement: T): T;
export declare function isUnassignedStub(object: Stubbable): boolean;
