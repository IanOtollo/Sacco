export const PIN_LENGTH = 4;

const PIN_PATTERN = /^\d{4}$/;

export function isValidPin(pin: string): boolean {
  return PIN_PATTERN.test(pin);
}

export function assertValidPin(pin: string): void {
  if (!PIN_PATTERN.test(pin)) {
    throw new Error("PIN must be exactly 4 digits.");
  }
}
