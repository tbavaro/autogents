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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvVXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw2QkFDRSxLQUE0QixFQUM1QixTQUF5QztJQUV6QyxNQUFNLE1BQU0sR0FBMEIsRUFBRSxDQUFDO0lBQ3pDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtRQUN2QyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUM5QixDQUFDLENBQUMsQ0FBQztJQUNILE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFURCxrREFTQztBQUVELDRCQUNFLEtBQWlCLEVBQ2pCLFNBQW9DO0lBRXBDLE1BQU0sTUFBTSxHQUFHLElBQUksR0FBRyxFQUFTLENBQUM7SUFDaEMsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRTtRQUMxQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7S0FDeEM7SUFDRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBVEQsZ0RBU0M7QUFFRCxtQkFDRSxLQUFxQjtJQUVyQixNQUFNLE1BQU0sR0FBeUIsRUFBRSxDQUFDO0lBQ3hDLEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLEVBQUU7UUFDMUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQztLQUNyQjtJQUNELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFSRCw4QkFRQztBQUVELGlCQUEyQixLQUFVLEVBQUUsTUFBbUI7SUFDeEQsS0FBSyxNQUFNLENBQUMsSUFBSSxNQUFNLEVBQUU7UUFDdEIsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNmO0FBQ0gsQ0FBQztBQUpELDBCQUlDO0FBRUQsZ0JBQTBCLE1BQWMsRUFBRSxNQUFtQjtJQUMzRCxLQUFLLE1BQU0sQ0FBQyxJQUFJLE1BQU0sRUFBRTtRQUN0QixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ2Y7QUFDSCxDQUFDO0FBSkQsd0JBSUM7QUFFRCw0QkFDRSxLQUFjLEVBQ2QsU0FBNEIsRUFDNUIsZUFBeUI7SUFFekIsTUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLEVBQU0sQ0FBQztJQUM3QixLQUFLLE1BQU0sS0FBSyxJQUFJLEtBQUssRUFBRTtRQUN6QixNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLGVBQWUsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQzVDLE1BQU0sSUFBSSxLQUFLLENBQUMsa0NBQWtDLEdBQUcsUUFBUSxDQUFDLENBQUM7U0FDaEU7UUFDRCxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQ3RCO0lBQ0QsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQWRELGdEQWNDO0FBRUQsdUJBQWlDLEtBQW9CO0lBQ25ELElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtRQUN2QixNQUFNLElBQUksS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUM7S0FDekM7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFMRCxzQ0FLQyJ9