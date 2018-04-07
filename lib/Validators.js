"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        const children = {};
        for (const key of Object.keys(this.propertyValidators)) {
            const validator = this.propertyValidators[key];
            children[key] = validator.describe();
        }
        return Validator.describeHelper("ObjectValidator", {
            propertyValidators: children
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVmFsaWRhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9WYWxpZGF0b3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEscUJBQTZCLFNBQVEsS0FBSztJQUd4QyxZQUFZLEdBQVcsRUFBRSxLQUF1QjtRQUM5QyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDWCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUNyQixDQUFDO0NBQ0Y7QUFQRCwwQ0FPQztBQUVEO0lBTVksTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFZLEVBQUUsZUFBb0I7UUFDaEUsdUJBQVMsSUFBSSxFQUFFLElBQUksSUFBSyxlQUFlLEVBQUc7SUFDNUMsQ0FBQztDQUNGO0FBVEQsOEJBU0M7QUFHRCxpQkFBeUIsU0FBUSxTQUFTO0lBR3hDLFlBQVksVUFBdUI7UUFDakMsS0FBSyxFQUFFLENBQUM7UUFDUixJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztJQUMvQixDQUFDO0lBRU0sUUFBUSxDQUFDLEtBQVU7UUFDeEIsTUFBTSxTQUFTLEdBQ2IsU0FBUztZQUNULElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUMvQixJQUFJO29CQUNGLFNBQVMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzFCLE9BQU8sSUFBSSxDQUFDO2lCQUNiO2dCQUFDLE9BQU8sQ0FBQyxFQUFFO29CQUNWLElBQUksQ0FBQyxZQUFZLGVBQWUsRUFBRTt3QkFDaEMsT0FBTyxLQUFLLENBQUM7cUJBQ2Q7eUJBQU07d0JBQ0wsTUFBTSxDQUFDLENBQUM7cUJBQ1Q7aUJBQ0Y7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUVMLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDZCxNQUFNLElBQUksZUFBZSxDQUFDLG9CQUFvQixDQUFDLENBQUM7U0FDakQ7SUFDSCxDQUFDO0lBRU0sUUFBUTtRQUNiLE9BQU8sU0FBUyxD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