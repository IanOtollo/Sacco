const KENYA_COUNTRY_CODE = "254";

/**
 * Normalizes Kenyan mobile numbers (07XXXXXXXX, 7XXXXXXXX, 254XXXXXXXXX,
 * +254XXXXXXXXX) to a canonical E.164 string so the same number always
 * maps to the same auth account regardless of how it was typed.
 */
export function normalizeKenyanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  let national: string;

  if (digits.startsWith(KENYA_COUNTRY_CODE) && digits.length === 12) {
    national = digits.slice(3);
  } else if (digits.startsWith("0") && digits.length === 10) {
    national = digits.slice(1);
  } else if (digits.length === 9) {
    national = digits;
  } else {
    throw new Error("Enter a valid Kenyan phone number, e.g. 0712345678");
  }

  if (!/^[17]\d{8}$/.test(national)) {
    throw new Error("Enter a valid Kenyan phone number, e.g. 0712345678");
  }

  return `+${KENYA_COUNTRY_CODE}${national}`;
}

/** +254712345678 -> 0712 345 678 */
export function formatPhoneDisplay(e164: string): string {
  const match = /^\+254(\d{3})(\d{3})(\d{3})$/.exec(e164);
  if (!match) return e164;
  return `0${match[1]} ${match[2]} ${match[3]}`;
}
