export declare class SenecaError extends Error {
    readonly code: string;
    readonly statusCode: number;
    constructor(message: string, code: string, statusCode: number);
}
export declare class UnauthorizedError extends SenecaError {
    constructor(message?: string);
}
export declare class NotFoundError extends SenecaError {
    constructor(message?: string);
}
export declare class ValidationError extends SenecaError {
    constructor(message: string);
}
export declare class PrivacyViolationError extends SenecaError {
    constructor(message: string);
}
export declare class ConflictError extends SenecaError {
    constructor(message?: string);
}
export declare class RateLimitedError extends SenecaError {
    constructor(message?: string);
}
export declare class TokenExpiredError extends SenecaError {
    constructor();
}
export declare class TokenSpentError extends SenecaError {
    constructor();
}
export declare class IdentityMismatchError extends SenecaError {
    constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map