// ==============================================================================
// DOMAIN ERRORS: Career Profile & Onboarding Lifecycle
// Module: @/features/profile/errors/profile-errors
// ==============================================================================

export class ProfileNotFoundError extends Error {
  public readonly statusCode = 404;

  constructor(profileId: string) {
    super(`Career profile not found for user: ${profileId}`);
    this.name = "ProfileNotFoundError";
  }
}

export class VersionConflictError extends Error {
  public readonly statusCode = 409;
  public readonly expectedVersion: number;
  public readonly currentVersion: number;

  constructor(expectedVersion: number, currentVersion: number) {
    super(
      `Profile version conflict: expected version ${expectedVersion}, but current database version is ${currentVersion}. Refresh and try again.`,
    );
    this.name = "VersionConflictError";
    this.expectedVersion = expectedVersion;
    this.currentVersion = currentVersion;
  }
}

export class InvalidProfileStateError extends Error {
  public readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = "InvalidProfileStateError";
  }
}

export class ProfileValidationError extends Error {
  public readonly statusCode = 422;
  public readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "ProfileValidationError";
    this.details = details;
  }
}
