export class SenecaError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = "SenecaError";
    }
}
export class UnauthorizedError extends SenecaError {
    constructor(message = "unauthorized") {
        super(message, "UNAUTHORIZED", 401);
    }
}
export class NotFoundError extends SenecaError {
    constructor(message = "not found") {
        super(message, "NOT_FOUND", 404);
    }
}
export class ValidationError extends SenecaError {
    constructor(message) {
        super(message, "VALIDATION", 400);
    }
}
export class PrivacyViolationError extends SenecaError {
    constructor(message) {
        super(message, "PRIVACY_VIOLATION", 403);
    }
}
export class ConflictError extends SenecaError {
    constructor(message = "conflict") {
        super(message, "BRIDGE_EXISTS", 409);
    }
}
export class RateLimitedError extends SenecaError {
    constructor(message = "rate limit exceeded") {
        super(message, "RATE_LIMITED", 429);
    }
}
export class TokenExpiredError extends SenecaError {
    constructor() {
        super("Link token has expired", "TOKEN_EXPIRED", 401);
    }
}
export class TokenSpentError extends SenecaError {
    constructor() {
        super("Link token has already been used", "TOKEN_SPENT", 401);
    }
}
export class IdentityMismatchError extends SenecaError {
    constructor(message) {
        super(message, "IDENTITY_MISMATCH", 403);
    }
}
//# sourceMappingURL=errors.js.map