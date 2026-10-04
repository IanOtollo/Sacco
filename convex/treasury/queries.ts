import { query } from "../_generated/server";
import { getCurrentUserDoc } from "../authz";
import { canEditTreasury, canViewTreasury, signedAmount } from "./helpers";

// The Sacco's real money in the bank and in M-Pesa. Only the chairman
// (view + edit), deputy chairman, other super admins and the treasurer
// (view only) can see these — everyone else gets null.
export const getBalances = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserDoc(ctx);
    if (!user || user.isActive === false || !canViewTreasury(user)) return null;

    const entries = await ctx.db.query("treasuryEntries").collect();
    let bank = 0;
    let mpesa = 0;
    for (const e of entries) {
      const delta = signedAmount(e);
      if (e.channel === "bank") bank += delta;
      else mpesa += delta;
    }

    const recent = [...entries]
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 40);
    const history = await Promise.all(
      recent.map(async (e) => {
        const by = await ctx.db.get(e.recordedBy);
        return {
          _id: e._id,
          channel: e.channel,
          kind: e.kind,
          amount: e.amount,
          note: e.note,
          entryDate: e.entryDate,
          recordedByName: by?.name ?? "—",
          createdAt: e._creationTime,
        };
      })
    );

    return {
      canEdit: canEditTreasury(user),
      bank: Math.round(bank * 100) / 100,
      mpesa: Math.round(mpesa * 100) / 100,
      history,
    };
  },
});
