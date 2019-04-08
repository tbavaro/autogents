"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function transformPOJOValues(input, transform) {
    const output = {};
    Object.entries(input).forEach(([k, v]) => {
        output[k] = transform(v, k);
    });
    return output;
}
exports.transformPOJOValues = transformPOJOValues;
function transformMapValues(input, transform) {
    const output = new Map();
    for (const [key, value] of input.entries()) {
        output.set(key, transform(value, key));
    }
    return output;
}
exports.transformMapValues = transformMapValues;
function mapToPOJO(input) {
    const output = {};
    for (const [key, value] of input.entries()) {
        output[key] = value;
    }
    return output;
}
exports.mapToPOJO = mapToPOJO;
function pushAll(array, values) {
    for (const v of values) {
        array.push(v);
    }
}
exports.pushAll = pushAll;
function addAll(target, values) {
    for (const v of values) {
        target.add(v);
    }
}
exports.addAll = addAll;
function transformSetValues(input, transform, allowCollisions) {
    const output = new Set();
    for (const value of input) {
        const newValue = transform(value);
        if (!allowCollisions && output.has(newValue)) {
            throw new Error("collision during set transform: " + newValue);
        }
        output.add(newValue);
    }
    return output;
}
exports.transformSetValues = transformSetValues;
function assertDefined(value) {
    if (value === undefined) {
        throw new Error("unexpected undefined");
    }
    return value;
}
exports.assertDefined = assertDefined;
function lazyInitialize(initializer) {
    let cachedValue;
    let isInitialized = false;
    return () => {
        if (!isInitialized) {
            cachedValue = initializer();
            isInitialized = true;
        }
        return cachedValue;
    };
}
exports.lazyInitialize = lazyInitialize;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvVXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxTQUFnQixtQkFBbUIsQ0FDakMsS0FBNEIsRUFDNUIsU0FBeUM7SUFFekMsTUFBTSxNQUFNLEdBQTBCLEVBQUUsQ0FBQztJQUN6QyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7UUFDdkMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDOUIsQ0FBQyxDQUFDLENBQUM7SUFDSCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBVEQsa0RBU0M7QUFFRCxTQUFnQixrQkFBa0IsQ0FDaEMsS0FBaUIsRUFDakIsU0FBb0M7SUFFcEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLEVBQVMsQ0FBQztJQUNoQyxLQUFLLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxFQUFFO1FBQzFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztLQUN4QztJQUNELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFURCxnREFTQztBQUVELFNBQWdCLFNBQVMsQ0FDdkIsS0FBcUI7SUFFckIsTUFBTSxNQUFNLEdBQXlCLEVBQUUsQ0FBQztJQUN4QyxLQUFLLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxFQUFFO1FBQzFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUM7S0FDckI7SUFDRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBUkQsOEJBUUM7QUFFRCxTQUFnQixPQUFPLENBQUksS0FBVSxFQUFFLE1BQW1CO0lBQ3hELEtBQUssTUFBTSxDQUFDLElBQUksTUFBTSxFQUFFO1FBQ3RCLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDZjtBQUNILENBQUM7QUFKRCwwQkFJQztBQUVELFNBQWdCLE1BQU0sQ0FBSSxNQUFjLEVBQUUsTUFBbUI7SUFDM0QsS0FBSyxNQUFNLENBQUMsSUFBSSxNQUFNLEVBQUU7UUFDdEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNmO0FBQ0gsQ0FBQztBQUpELHdCQUlDO0FBRUQsU0FBZ0Isa0JBQWtCLENBQ2hDLEtBQWMsRUFDZCxTQUE0QixFQUM1QixlQUF5QjtJQUV6QixNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsRUFBTSxDQUFDO0lBQzdCLEtBQUssTUFBTSxLQUFLLElBQUksS0FBSyxFQUFFO1FBQ3pCLE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNsQyxJQUFJLENBQUMsZUFBZSxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDNUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQ0FBa0MsR0FBRyxRQUFRLENBQUMsQ0FBQztTQUNoRTtRQUNELE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDdEI7SUFDRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBZEQsZ0RBY0M7QUFFRCxTQUFnQixhQUFhLENBQUksS0FBb0I7SUFDbkQsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3ZCLE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQztLQUN6QztJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUxELHNDQUtDO0FBRUQsU0FBZ0IsY0FBYyxDQUFJLFdBQW9CO0lBQ3BELElBQUksV0FBZ0IsQ0FBQztJQUNyQixJQUFJLGFBQWEsR0FBRyxLQUFLLENBQUM7SUFFMUIsT0FBTyxHQUFHLEVBQUU7UUFDVixJQUFJLENBQUMsYUFBYSxFQUFFO1lBQ2xCLFdBQVcsR0FBRyxXQUFXLEVBQUUsQ0FBQztZQUM1QixhQUFhLEdBQUcsSUFBSSxDQUFDO1NBQ3RCO1FBQ0QsT0FBTyxXQUFXLENBQUM7SUFDckIsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQVhELHdDQVdDIn0=