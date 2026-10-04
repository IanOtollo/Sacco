import { Doc, Id } from "../_generated/dataModel";
import { MutationCtx, QueryCtx } from "../_generated/server";

type TreasuryEntry = Pick<Doc<"treasuryEntries">, "kind" | "amount">;
export type TreasuryChannel = Doc<"treasuryEntries">["channel"];

export const TREASURY_CHANNEL_LABEL: Record<TreasuryChannel, string> = {
  bank: "bank",
  mpesa: "M-Pesa",
};

const round2 = (n: number) => Math.round(n * 100) / 100;

// "out" reduces the balance; "in" and "adjustment" add (an adjustment's
// amount is already signed).
export function signedAmount(entry: TreasuryEntry): number {
  return entry.kind === "out" ? -entry.amount : entry.amount;
}

// Chairman, deputy chairman, other super admins and the treasurer can see
// the figures.
export function canViewTreasury(user: Doc<"users">): boolean {
  return user.role === "super_admin" || user.committeeRole === "treasurer";
}

// Only the chairman and deputy chairman can change them directly — the
// treasurer reports discrepancies to the chairman instead.
export function canEditTreasury(user: Doc<"users">): boolean {
  return (
    user.role === "super_admin" &&
    (user.committeeRole === "chairman" || user.committeeRole === "deputy_chairman")
  );
}

export async function getTreasuryBalance(
  ctx: QueryCtx | MutationCtx,
  channel: TreasuryChannel
): Promise<number> {
  const entries = await ctx.db
    .query("treasuryEntries")
    .withIndex("by_channel", (q) => q.eq("channel", channel))
    .collect();
  return round2(entries.reduce((s, e) => s + signedAmount(e), 0));
}

// Posts a movement tied to a loan (money paid out on disbursement, money
// received on repayment). Money out can never exceed what is recorded.
export async function postLoanTreasuryEntry(
  ctx: MutationCtx,
  args: {
    channel: TreasuryChannel;
    kind: "in" | "out";
    amount: number;
    note: string;
    userId: Id<"users">;
    loanId: Id<"loans">;
  }
) {
  const amount = round2(args.amount);
  if (amount <= 0) return;

  if (args.kind === "out") {
    const balance = await getTreasuryBalance(ctx, args.channel);
    if (amount > balance + 0.001) {
      throw new Error(
        `Only KES ${balance.toLocaleString()} is recorded in the ${TREASURY_CHANNEL_LABEL[args.channel]} — ` +
          `less than the KES ${amount.toLocaleString()} to pay out. Ask the chairman to update the ` +
          `${TREASURY_CHANNEL_LABEL[args.channel]} balance, or choose the other source.`
      );
    }
  }

  await ctx.db.insert("treasuryEntries", {
    channel: args.channel,
    kind: args.kind,
    amount,
    note: args.note,
    entryDate: new Date().toISOString().slice(0, 10),
    recordedBy: args.userId,
    relatedLoanId: args.loanId,
  });
}
