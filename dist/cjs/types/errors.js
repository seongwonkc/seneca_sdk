"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityMismatchError = exports.TokenSpentError = exports.TokenExpiredError = exports.RateLimitedError = exports.ConflictError = exports.PrivacyViolationError = exports.ValidationError = exports.NotFoundError = exports.UnauthorizedError = exports.SenecaError = void 0;
class SenecaError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = "SenecaError";
    }
}
exports.SenecaError = SenecaError;
class UnauthorizedError extends SenecaError {
    constructor(message = "unauthorized") {
        super(message, "UNAUTHORIZED", 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class NotFoundError extends SenecaError {
    constructor(message = "not found") {
        super(message, "NOT_FOUND", 404);
    }
}
exports.NotFoundError = NotFoundError;
class ValidationError extends SenecaError {
    constructor(message) {
        super(message, "VALIDATION", 400);
    }
}
exports.ValidationError = ValidationError;
class PrivacyViolationError extends SenecaError {
    constructor(message) {
        super(message, "PRIVACY_VIOLATION", 403);
    }
}
exports.PrivacyViolationError = PrivacyViolationError;
class ConflictError extends SenecaError {
    constructor(message = "conflict") {
        super(message, "BRIDGE_EXISTS", 409);
    }
}
exports.ConflictError = ConflictError;
class RateLimitedError extends SenecaError {
    constructor(message = "rate limit exceeded") {
        super(message, "RATE_LIMITED", 429);
    }
}
exports.RateLimitedError = RateLimitedError;
class TokenExpiredError extends SenecaError {
    constructor() {
        super("Link token has expired", "TOKEN_EXPIRED", 401);
    }
}
exports.TokenExpiredError = TokenExpiredError;
class TokenSpentError extends SenecaError {
    constructor() {
        super("Link token has already been used", "TOKEN_SPENT", 401);
    }
}
exports.TokenSpentError = TokenSpentError;
class IdentityMismatchError extends SenecaError {
    constructor(message) {
        super(message, "IDENTITY_MISMATCH", 403);
    }
}
exports.IdentityMismatchError = IdentityMismatchError;
//# sourceMappingURL=errors.js.map