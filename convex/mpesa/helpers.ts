import { Doc } from "../_generated/dataModel";

const TRANSACTION_CODE = /^[A-Z0-9]{10}$/;

export function looksLikeTransactionCode(reference: string): boolean {
  return TRANSACTION_CODE.test(reference.trim().toUpperCase());
}

function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

// Members are asked for the name shown in their M-Pesa message, so a claim
// often carries a name rather than the transaction code. Two names match when
// they share at least two words and one set of words contains the other
// ("Jane Wanjiru" ↔ "JANE WANJIRU KAMAU").
export function namesMatch(a: string, b: string): boolean {
  const ta = new Set(nameTokens(a));
  const tb = new Set(nameTokens(b));
  if (ta.size < 2 || tb.size < 2) return false;
  const [small, large] = ta.size <= tb.size ? [ta, tb] : [tb, ta];
  return [...small].every((t) => large.has(t));
}

type PaymentLike = Pick<Doc<"mpesaPayments">, "transId" | "amount" | "payerName">;
type ClaimLike = Pick<Doc<"depositClaims">, "transactionReference" | "amount">;

// Same amount, and either the same transaction code or the same payer name.
export function paymentMatchesClaim(payment: PaymentLike, claim: ClaimLike): boolean {
  if (Math.abs(payment.amount - claim.amount) >= 0.01) return false;
  const reference = claim.transactionReference.trim();
  if (looksLikeTransactionCode(reference)) {
    return reference.toUpperCase() === payment.transId;
  }
  return namesMatch(reference, payment.payerName);
}
