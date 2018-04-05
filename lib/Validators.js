"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils = require("./Utils");
class ValidationError extends Error {
    constructor(msg, cause) {
        super(msg);
        this.cause = cause;
    }
}
exports.ValidationError = ValidationError;
class Validator {
    static describeHelper(kind, otherProperties) {
        return Object.assign({ kind: kind }, otherProperties);
    }
}
exports.Validator = Validator;
class OrValidator extends Validator {
    constructor(validators) {
        super();
        this.validators = validators;
    }
    validate(input) {
        const succeeded = undefined !==
            this.validators.find(validator => {
                try {
                    validator.validate(input);
                    return true;
                }
                catch (e) {
                    if (e instanceof ValidationError) {
                        return false;
                    }
                    else {
                        throw e;
                    }
                }
            });
        if (!succeeded) {
            throw new ValidationError("OrValidator failed");
        }
    }
    describe() {
        return Validator.describeHelper("OrValidator", {
            validators: this.validators.map(v => v.describe())
        });
    }
}
exports.OrValidator = OrValidator;
class ObjectValidator extends Validator {
    constructor(propertyValidators) {
        super();
        this.propertyValidators = propertyValidators;
    }
    validate(input) {
        if (typeof input !== "object" || input instanceof Array || input === null) {
            throw new ValidationError("ObjectValidator failed; not an object");
        }
        Object.entries(this.propertyValidators).forEach(([propertyName, validator]) => {
            try {
                validator.validate(input[propertyName]);
            }
            catch (e) {
                if (e instanceof ValidationError) {
                    throw new ValidationError(`ObjectValidator failed; property "${propertyName}"`, e);
                }
                else {
                    throw e;
                }
            }
        });
    }
    describe() {
        return Validator.describeHelper("ObjectValidator", {
            propertyValidators: Utils.transformPOJOValues(this.propertyValidators, (validator) => validator.describe())
        });
    }
}
exports.ObjectValidator = ObjectValidator;
class TypeOfValidator extends Validator {
    constructor(typeOfString) {
        super();
        this.typeOfString = typeOfString;
    }
    validate(input) {
        if (typeof input !== this.typeOfString) {
            throw new ValidationError("TypeOfValidator failed");
        }
    }
    describe() {
        return Validator.describeHelper("TypeOfValidator", {
            typeOfString: this.typeOfString
        });
    }
}
exports.TypeOfValidator = TypeOfValidator;
class ExactValueValidator extends Validator {
    constructor(value) {
        super();
        this.value = value;
    }
    validate(input) {
        if (input !== this.value) {
            throw new ValidationError("ExactValueValidator failed");
        }
    }
    describe() {
        return Validator.describeHelper("ExactValueValidator", {
            value: this.value
        });
    }
}
exports.ExactValueValidator = ExactValueValidator;
exports.undefinedValidator = new ExactValueValidator(undefined);
exports.nullValidator = new ExactValueValidator(null);
exports.stringValidator = new TypeOfValidator("string");
exports.numberValidator = new TypeOfValidator("number");
exports.booleanValidator = new TypeOfValidator("boolean");
function createValidationFunction(validator) {
    return (input => {
        validator.validate(input);
        return input;
    });
}
exports.createValidationFunction = createValidationFunction;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVmFsaWRhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9WYWxpZGF0b3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaUNBQWlDO0FBRWpDLHFCQUE2QixTQUFRLEtBQUs7SUFHeEMsWUFBWSxHQUFXLEVBQUUsS0FBdUI7UUFDOUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ1gsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDckIsQ0FBQztDQUNGO0FBUEQsMENBT0M7QUFFRDtJQU1ZLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBWSxFQUFFLGVBQW9CO1FBQ2hFLHVCQUFTLElBQUksRUFBRSxJQUFJLElBQUssZUFBZSxFQUFHO0lBQzVDLENBQUM7Q0FDRjtBQVRELDhCQVNDO0FBR0QsaUJBQXlCLFNBQVEsU0FBUztJQUd4QyxZQUFZLFVBQXVCO1FBQ2pDLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7SUFDL0IsQ0FBQztJQUVNLFFBQVEsQ0FBQyxLQUFVO1FBQ3hCLE1BQU0sU0FBUyxHQUNiLFNBQVM7WUFDVCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDL0IsSUFBSTtvQkFDRixTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUMxQixPQUFPLElBQUksQ0FBQztpQkFDYjtnQkFBQyxPQUFPLENBQUMsRUFBRTtvQkFDVixJQUFJLENBQUMsWUFBWSxlQUFlLEVBQUU7d0JBQ2hDLE9BQU8sS0FBSyxDQUFDO3FCQUNkO3lCQUFNO3dCQUNMLE1BQU0sQ0FBQyxDQUFDO3FCQUNUO2lCQUNGO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFTCxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2QsTUFBTSxJQUFJLGVBQWUsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1NBQ2pEO0lBQ0gsQ0FBQztJQUVNLFFBQVE7UUFD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