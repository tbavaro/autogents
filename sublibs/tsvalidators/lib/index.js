"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ValidationError extends Error {
    constructor(msg, causes) {
        super(msg);
        this.causes = causes;
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
        const failures = [];
        const succeeded = undefined !==
            this.validators.find(validator => {
                try {
                    validator.validate(input);
                    return true;
                }
                catch (e) {
                    if (e instanceof ValidationError) {
                        failures.push(e);
                        return false;
                    }
                    else {
                        throw e;
                    }
                }
            });
        if (!succeeded) {
            throw new ValidationError("OrValidator failed", failures);
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
                    throw new ValidationError(`ObjectValidator failed; property "${propertyName}"`, [e]);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxxQkFBNkIsU0FBUSxLQUFLO0lBR3hDLFlBQVksR0FBVyxFQUFFLE1BQTBCO1FBQ2pELEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNYLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3ZCLENBQUM7Q0FDRjtBQVBELDBDQU9DO0FBRUQ7SUFNWSxNQUFNLENBQUMsY0FBYyxDQUFDLElBQVksRUFBRSxlQUFvQjtRQUNoRSx1QkFBUyxJQUFJLEVBQUUsSUFBSSxJQUFLLGVBQWUsRUFBRztJQUM1QyxDQUFDO0NBQ0Y7QUFURCw4QkFTQztBQUdELGlCQUF5QixTQUFRLFNBQVM7SUFHeEMsWUFBWSxVQUF1QjtRQUNqQyxLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO0lBQy9CLENBQUM7SUFFTSxRQUFRLENBQUMsS0FBVTtRQUN4QixNQUFNLFFBQVEsR0FBc0IsRUFBRSxDQUFDO1FBQ3ZDLE1BQU0sU0FBUyxHQUNiLFNBQVM7WUFDVCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDL0IsSUFBSTtvQkFDRixTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUMxQixPQUFPLElBQUksQ0FBQztpQkFDYjtnQkFBQyxPQUFPLENBQUMsRUFBRTtvQkFDVixJQUFJLENBQUMsWUFBWSxlQUFlLEVBQUU7d0JBQ2hDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ2pCLE9BQU8sS0FBSyxDQUFDO3FCQUNkO3lCQUFNO3dCQUNMLE1BQU0sQ0FBQyxDQUFDO3FCQUNUO2lCQUNGO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFTCxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2QsTUFBTSxJQUFJLGVBQWUs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