import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireUser } from "../authz";
import { logAction } from "../audit";
import {
  canEditTreasury,
  getTreasuryBalance,
  TREASURY_CHANNEL_LABEL as CHANNEL_LABEL,
} from "./helpers";

const channelValidator = v.union(v.literal("bank"), v.literal("mpesa"));

// Record a movement, or reset a channel to the figure on the real statement.
//   in      — money received
//   out     — money paid out (cannot exceed the current balance)
//   set     — "the real balance is X": stored as an adjustment for the
//             difference, so the history still shows how it changed
export const record = mutation({
  args: {
    channel: channelValidator,
    kind: v.union(v.literal("in"), v.literal("out"), v.literal("set")),
    amount: v.number(),
    note: v.string(),
    entryDate: v.optional(v.string()),
  },
  handler: async (ctx, { channel, kind, amount, note, entryDate }) => {
    const user = await requireUser(ctx);
    if (!canEditTreasury(user)) {
      throw new Error("Only the chairman can change the bank and M-Pesa balances");
    }
    if (!Number.isFinite(amount)) throw new Error("Enter a valid amount");
    const trimmedNote = note.trim();
    if (trimmedNote.length < 3) throw new Error("Add a short note explaining this entry");

    const amountRounded = Math.round(amount * 100) / 100;
    if (kind === "set" ? amountRounded < 0 : amountRounded <= 0) {
      throw new Error(
        kind === "set" ? "The balance cannot be negative" : "Amount must be greater than zero"
      );
    }

    const current = await getTreasuryBalance(ctx, channel);

    let storedKind: "in" | "out" | "adjustment";
    let storedAmount: number;
    if (kind === "set") {
      storedKind = "adjustment";
      storedAmount = Math.round((amountRounded - current) * 100) / 100;
      if (storedAmount === 0) throw new Error("That is already the current balance");
    } else {
      storedKind = kind;
      storedAmount = amountRounded;
      if (kind === "out" && amountRounded > current + 0.001) {
        throw new Error(
          `Only KES ${current.toLocaleString()} is recorded in the ${CHANNEL_LABEL[channel]} — cannot pay out more`
        );
      }
    }

    const id = await ctx.db.insert("treasuryEntries", {
      channel,
      kind: storedKind,
      amount: storedAmount,
      note: trimmedNote,
      entryDate: entryDate ?? new Date().toISOString().slice(0, 10),
      recordedBy: user._id,
    });

    await logAction(ctx, {
      userId: user._id,
      action: "treasury.record",
      entityType: "treasuryEntry",
      entityId: id,
      details: { channel, kind: storedKind, amount: storedAmount, balanceBefore: current },
    });
  },
});
