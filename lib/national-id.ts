/**
 * Normalizes a National ID / registration number to a canonical form so
 * the same ID always maps to the same auth account regardless of stray
 * whitespace or letter casing.
 */
export function normalizeNationalId(raw: string): string {
  const cleaned = raw.replace(/\s+/g, "").toUpperCase();
  if (cleaned.length < 4) {
    throw new Error("Enter a valid National ID / registration number");
  }
  return cleaned;
}
