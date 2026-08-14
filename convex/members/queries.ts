import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireAdmin, requireUser } from "../authz";

export const list = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("suspended"),
        v.literal("dormant"),
        v.literal("exited")
      )
    ),
    joinedStart: v.optional(v.string()),
    joinedEnd: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let members = args.status
      ? await ctx.db
          .query("members")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .collect()
      : await ctx.db.query("members").collect();

    if (args.search) {
      const term = args.search.toLowerCase();
      members = members.filter((m) =>
        `${m.firstName} ${m.lastName} ${m.memberNumber} ${m.phoneNumber} ${m.nationalId}`
          .toLowerCase()
          .includes(term)
      );
    }

    if (args.joinedStart) {
      members = members.filter((m) => m.dateJoined >= args.joinedStart!);
    }
    if (args.joinedEnd) {
      members = members.filter((m) => m.dateJoined <= args.joinedEnd!);
    }

    members.sort((a, b) => b._creationTime - a._creationTime);

    return await Promise.all(
      members.map(async (m) => {
        const accounts = await ctx.db
          .query("accounts")
          .withIndex("by_member", (q) => q.eq("memberId", m._id))
          .collect();
        const savings = accounts.find((a) => a.type === "savings");
        const shares = accounts.find((a) => a.type === "shares");
        return {
          ...m,
          savingsBalance: savings?.balance ?? 0,
          sharesBalance: shares?.balance ?? 0,
        };
      })
    );
  },
});

export const getById = query({
  args: { memberId: v.id("members") },
  handler: async (ctx, { memberId }) => {
    const caller = await requireUser(ctx);
    const member = await ctx.db.get(memberId);
    if (!member) return null;

    const isSelf = caller.role === "member" && caller.memberId === memberId;
    const isAdmin = caller.role === "admin" || caller.role === "super_admin";
    if (!isSelf && !isAdmin) {
      throw new Error("Not authorized");
    }

    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_member", (q) => q.eq("memberId", memberId))
      .collect();

    const photoUrl = member.profilePhoto
      ? await ctx.storage.getUrl(member.profilePhoto)
      : null;

    return { ...member, accounts, photoUrl };
  },
});

// Minimal, non-financial fields for the guarantor picker — any authenticated
// member can search for a fellow active member to ask as a guarantor.
export const searchGuarantorCandidates = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, { search }) => {
    const caller = await requireUser(ctx);

    const active = await ctx.db
      .query("members")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const term = search?.toLowerCase().trim();
    const filtered = active.filter((m) => {
      if (m._id === caller.memberId) return false;
      if (!term) return true;
      return `${m.firstName} ${m.lastName} ${m.memberNumber}`
        .toLowerCase()
        .includes(term);
    });

    return filtered.slice(0, 20).map((m) => ({
      _id: m._id,
      memberNumber: m.memberNumber,
      name: `${m.firstName} ${m.lastName}`,
    }));
  },
});

export const getMyMember = query({
  args: {},
  handler: async (ctx) => {
    const caller = await requireUser(ctx);
    if (!caller.memberId) return null;
    const member = await ctx.db.get(caller.memberId);
    if (!member) return null;

    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_member", (q) => q.eq("memberId", caller.memberId!))
      .collect();

    const photoUrl = member.profilePhoto
      ? await ctx.storage.getUrl(member.profilePhoto)
      : null;

    return { ...member, accounts, photoUrl };
  },
});
