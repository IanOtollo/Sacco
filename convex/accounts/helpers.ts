export function generateReferenceNumber(): string {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(10000 + Math.random() * 90000);
  return `TXN-${datePart}-${randomPart}`;
}
