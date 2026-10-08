import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query, QueryCtx } from "../_generated/server";
import { Doc } from "../_generated/dataModel";
import { requireTreasurer, requireUser } from "../authz";

type MemberStatus = "active" | "suspended" | "dormant" | "exited";

async function withBalances(ctx: QueryCtx, members: Doc<"members">[]) {
  return await Promise.all(
    members.map(async (m) => {
      const accounts = await ctx.db
        .query("accounts")
        .withIndex("by_member", (q) => q.eq("memberId", m._id))
        .collect();
      const savings = accounts.find((a) => a.type === "savings");
      const sharesBalance = accounts
        .filter((a) => a.type !== "savings")
        .reduce((sum, a) => sum + a.balance, 0);
      return {
        ...m,
        savingsBalance: savings?.balance ?? 0,
        sharesBalance,
      };
    })
  );
}

// Index-backed text search (name, member no., phone, ID — prefix matching on
// each word). Reads only matching rows, never the whole members table.
function searchMembers(ctx: QueryCtx, term: string, status?: MemberStatus) {
  return ctx.db.query("members").withSearchIndex("search_members", (q) => {
    const base = q.search("searchText", term);
    return status ? base.eq("status", status) : base;
  });
}

const statusValidator = v.union(
  v.literal("active"),
  v.literal("suspended"),
  v.literal("dormant"),
  v.literal("exited")
);

// Non-paged list for pickers, global search and reports. Searches are capped
// at 100 results via the search index; with no search it returns everyone.
export const list = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(statusValidator),
    joinedStart: v.optional(v.string()),
    joinedEnd: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireTreasurer(ctx);

    const term = args.search?.trim();
    let members = term
      ? await searchMembers(ctx, term, args.status).take(100)
      : args.status
        ? await ctx.db
            .query("members")
            .withIndex("by_status", (q) => q.eq("status", args.status!))
            .collect()
        : await ctx.db.query("members").collect();

    // Non-member loan borrowers are lightweight records for loan tracking
    // only — they never show up in the Sacco's actual membership roster.
    members = members.filter((m) => !m.isNonMember);

    if (args.joinedStart) {
      members = members.filter((m) => m.dateJoined >= args.joinedStart!);
    }
    if (args.joinedEnd) {
      members = members.filter((m) => m.dateJoined <= args.joinedEnd!);
    }

    if (!term) members.sort((a, b) => b._creationTime - a._creationTime);

    return await withBalances(ctx, members);
  },
});

// Paginated roster for the admin Members page ("Load more").
export const listPage = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    status: v.optional(statusValidator),
    sort: v.optional(v.union(v.literal("newest"), v.literal("name"))),
  },
  handler: async (ctx, { paginationOpts, search, status, sort }) => {
    await requireTreasurer(ctx);

    const term = search?.trim();
    const result = term
      ? await searchMembers(ctx, term, status).paginate(paginationOpts)
      : sort === "name"
        ? await ctx.db
            .query("members")
            .withIndex("by_name")
            .filter((q) =>
              status
                ? q.and(q.neq(q.field("isNonMember"), true), q.eq(q.field("status"), status))
                : q.neq(q.field("isNonMember"), true)
            )
            .paginate(paginationOpts)
        : await ctx.db
            .query("members")
            .order("desc")
            .filter((q) =>
              status
                ? q.and(q.neq(q.field("isNonMember"), true), q.eq(q.field("status"), status))
                : q.neq(q.field("isNonMember"), true)
            )
            .paginate(paginationOpts);

    return {
      ...result,
      page: await withBalances(
        ctx,
        result.page.filter((m) => !m.isNonMember)
      ),
    };
  },
});

// Roster size for the header badge — returns just a number.
export const countAll = query({
  args: {},
  handler: async (ctx) => {
    await requireTreasurer(ctx);
    let total = 0;
    for (const status of ["active", "suspended", "dormant", "exited"] as const) {
      const rows = await ctx.db
        .query("members")
        .withIndex("by_status", (q) => q.eq("status", status))
        .collect();
      total += rows.filter((m) => !m.isNonMember).length;
    }
    return total;
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

    const linkedUser = member.userId ? await ctx.db.get(member.userId) : null;

    return { ...member, accounts, photoUrl, userRole: linkedUser?.role };
  },
});

// Minimal, non-financial fields for the guarantor picker — any authenticated
// member can search for a fellow active member to ask as a guarantor.
// Public — reachable from the logged-out sign-up form so applicants can
// pick who invited them. Deliberately minimal: no phone/ID/balance data.
export const searchForInvitor = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, { search }) => {
    const term = search?.toLowerCase().trim();
    if (!term) return [];

    const found = await searchMembers(ctx, term, "active").take(40);
    const filtered = found.filter((m) => !m.isNonMember);

    return filtered.slice(0, 20).map((m) => ({
      _id: m._id,
      memberNumber: m.memberNumber,
      name: `${m.firstName} ${m.lastName}`,
    }));
  },
});

export const searchGuarantorCandidates = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, { search }) => {
    const caller = await requireUser(ctx);

    const term = search?.trim();
    const found = term
      ? await searchMembers(ctx, term, "active").take(40)
      : await ctx.db
          .query("members")
          .withIndex("by_status", (q) => q.eq("status", "active"))
          .take(40);
    const filtered = found.filter((m) => !m.isNonMember && m._id !== caller.memberId);

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
