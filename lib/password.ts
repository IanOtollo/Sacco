export const PASSWORD_MIN_LENGTH = 6;

export function isValidPassword(password: string): boolean {
  return typeof password === "string" && password.length >= PASSWORD_MIN_LENGTH;
}

export function assertValidPassword(password: string): void {
  if (!isValidPassword(password)) {
    throw new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
  }
}
