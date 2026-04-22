export class SenecaError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
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
  constructor(message: string) {
    super(message, "VALIDATION", 400);
  }
}

export class PrivacyViolationError extends SenecaError {
  constructor(message: string) {
    super(message, "PRIVACY_VIOLATION", 403);
  }
}
