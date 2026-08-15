import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export function generateReferenceNumber(): string {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(10000 + Math.random() * 90000);
  return `TXN-${datePart}-${randomPart}`;
}

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  savings: "savings",
  shares_long_term: "long-term shares",
  shares_short_term: "short-term shares",
  shares_capital: "capital shares",
};

// Shared by accounts.mutations.deposit (admin, direct) and
// depositClaims.mutations.approve/recordDirect (treasurer) so both paths
// credit balances identically instead of duplicating the logic.
export async function creditAccountBalance(
  ctx: MutationCtx,
  args: {
    memberId: Id<"members">;
    type: "savings" | "shares_long_term" | "shares_short_term" | "shares_capital";
    amount: number;
    channel: "cash" | "mpesa" | "bank_transfer" | "system";
    description?: string;
    processedBy: Id<"users">;
    receiptNumber?: string;
    narration?: string;
  }
): Promise<{ balanceAfter: number }> {
  const account = await ctx.db
    .query("accounts")
    .withIndex("by_member_type", (q) =>
      q.eq("memberId", args.memberId).eq("type", args.type)
    )
    .first();
  if (!account) throw new Error("Account not found");

  const balanceBefore = account.balance;
  const balanceAfter = balanceBefore + args.amount;
  await ctx.db.patch(account._id, { balance: balanceAfter });

  const isShares = args.type !== "savings";
  const label = ACCOUNT_TYPE_LABEL[args.type];

  await ctx.db.insert("transactions", {
    accountId: account._id,
    memberId: args.memberId,
    type: isShares ? "share_purchase" : "deposit",
    amount: args.amount,
    balanceBefore,
    balanceAfter,
    description: args.description ?? `Deposit to ${label} via ${args.channel}`,
    referenceNumber: generateReferenceNumber(),
    processedBy: args.processedBy,
    channel: args.channel,
    status: "completed",
    receiptNumber: args.receiptNumber,
    narration: args.narration,
  });

  return { balanceAfter };
}
