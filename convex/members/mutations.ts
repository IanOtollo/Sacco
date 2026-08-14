import { v } from "convex/values";
import { internalMutation, mutation } from "../_generated/server";
import { generateMemberNumber } from "./helpers";
import { requireAdmin, requireSuperAdmin, requireUser } from "../authz";
import { logAction } from "../audit";
import { Id } from "../_generated/dataModel";

const genderValidator = v.union(
  v.literal("male"),
  v.literal("female"),
  v.literal("other")
);

const registerArgs = {
  firstName: v.string(),
  lastName: v.string(),
  middleName: v.optional(v.string()),
  nationalId: v.string(),
  phoneNumber: v.string(),
  email: v.optional(v.string()),
  dateOfBirth: v.optional(v.string()),
  gender: genderValidator,
  occupation: v.optional(v.string()),
  employer: v.optional(v.string()),
  postalAddress: v.optional(v.string()),
  residentialAddress: v.optional(v.string()),
  nextOfKinName: v.string(),
  nextOfKinPhone: v.string(),
  nextOfKinRelationship: v.string(),
};

export const createMemberRecord = internalMutation({
  args: {
    ...registerArgs,
    phoneNumber: v.string(),
    userId: v.id("users"),
    registeredBy: v.id("users"),
  },
  returns: v.object({
    memberId: v.id("members"),
    memberNumber: v.string(),
  }),
  handler: async (
    ctx,
    args
  ): Promise<{ memberId: Id<"members">; memberNumber: string }> => {
    const memberNumber = await generateMemberNumber(ctx);
    const today = new Date().toISOString().slice(0, 10);

    const memberId = await ctx.db.insert("members", {
      memberNumber,
      firstName: args.firstName,
      lastName: args.lastName,
      middleName: args.middleName,
      nationalId: args.nationalId,
      phoneNumber: args.phoneNumber,
      email: args.email,
      dateOfBirth: args.dateOfBirth,
      gender: args.gender,
      occupation: args.occupation,
      employer: args.employer,
      postalAddress: args.postalAddress,
      residentialAddress: args.residentialAddress,
      nextOfKinName: args.nextOfKinName,
      nextOfKinPhone: args.nextOfKinPhone,
      nextOfKinRelationship: args.nextOfKinRelationship,
      dateJoined: today,
      status: "active",
      userId: args.userId,
      registeredBy: args.registeredBy,
    });

    await ctx.db.patch(args.userId, { memberId });

    await ctx.db.insert("accounts", {
      memberId,
      type: "savings",
      accountNumber: `SAV-${memberNumber}`,
      balance: 0,
      minimumBalance: 0,
      isActive: true,
    });

    await ctx.db.insert("accounts", {
      memberId,
      type: "shares_capital",
      accountNumber: `SHC-${memberNumber}`,
      balance: 0,
      minimumBalance: 5000,
      isActive: true,
    });

    await ctx.db.insert("accounts", {
      memberId,
      type: "shares_long_term",
      accountNumber: `SHL-${memberNumber}`,
      balance: 0,
      minimumBalance: 0,
      isActive: true,
    });

    await ctx.db.insert("accounts", {
      memberId,
      type: "shares_short_term",
      accountNumber: `SHS-${memberNumber}`,
      balance: 0,
      minimumBalance: 0,
      isActive: true,
    });

    await logAction(ctx, {
      userId: args.registeredBy,
      action: "member.register",
      entityType: "member",
      entityId: memberId,
      details: { memberNumber, name: `${args.firstName} ${args.lastName}` },
    });

    return { memberId, memberNumber };
  },
});

export const updateStatus = mutation({
  args: {
    memberId: v.id("members"),
    status: v.union(
      v.literal("active"),
      v.literal("suspended"),
      v.literal("dormant"),
      v.literal("exited")
    ),
  },
  handler: async (ctx, { memberId, status }) => {
    const admin = await requireAdmin(ctx);
    const member = await ctx.db.get(memberId);
    if (!member) throw new Error("Member not found");

    await ctx.db.patch(memberId, { status });

    if (member.userId) {
      await ctx.db.patch(member.userId, { isActive: status === "active" });
    }

    await logAction(ctx, {
      userId: admin._id,
      action: "member.statusChange",
      entityType: "member",
      entityId: memberId,
      details: { from: member.status, to: status },
    });
  },
});

const SELF_EDITABLE_FIELDS = [
  "postalAddress",
  "residentialAddress",
  "nextOfKinName",
  "nextOfKinPhone",
  "nextOfKinRelationship",
] as const;

export const update = mutation({
  args: {
    memberId: v.id("members"),
    patch: v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      middleName: v.optional(v.string()),
      email: v.optional(v.string()),
      occupation: v.optional(v.string()),
      employer: v.optional(v.string()),
      postalAddress: v.optional(v.string()),
      residentialAddress: v.optional(v.string()),
      nextOfKinName: v.optional(v.string()),
      nextOfKinPhone: v.optional(v.string()),
      nextOfKinRelationship: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { memberId, patch }) => {
    const caller = await requireUser(ctx);
    const member = await ctx.db.get(memberId);
    if (!member) throw new Error("Member not found");

    const isSelf = caller.role === "member" && caller.memberId === memberId;
    const isAdmin = caller.role === "admin" || caller.role === "super_admin";
    if (!isSelf && !isAdmin) {
      throw new Error("Not authorized");
    }

    if (isSelf) {
      const disallowed = Object.keys(patch).filter(
        (k) => !(SELF_EDITABLE_FIELDS as readonly string[]).includes(k)
      );
      if (disallowed.length > 0) {
        throw new Error(
          "You can only update your address and next of kin details."
        );
      }
    }

    await ctx.db.patch(memberId, patch);

    await logAction(ctx, {
      userId: caller._id,
      action: "member.update",
      entityType: "member",
      entityId: memberId,
      details: patch,
    });
  },
});

const committeeRoleValidator = v.union(
  v.literal("chairman"),
  v.literal("deputy_chairman"),
  v.literal("secretary"),
  v.literal("treasurer")
);

const TOP_OFFICES = new Set(["chairman", "deputy_chairman"]);

// Governance-sensitive — only a super admin can appoint or remove chairman,
// deputy chairman, secretary, or treasurer. Chairman/deputy are promoted to
// role "super_admin" (matching the spec's "chairman = super_admin, can do
// everything") but keep their linked member profile; secretary/treasurer
// stay role "member" and get extra modules unlocked in their portal.
export const setCommitteeRole = mutation({
  args: {
    memberId: v.id("members"),
    committeeRole: v.optional(committeeRoleValidator),
  },
  handler: async (ctx, { memberId, committeeRole }) => {
    const admin = await requireSuperAdmin(ctx);
    const member = await ctx.db.get(memberId);
    if (!member) throw new Error("Member not found");
    if (!member.userId) {
      throw new Error("This member has no linked login account");
    }

    // Only one chairman and one deputy chairman at a time — stepping the
    // previous holder down when someone new is appointed.
    if (committeeRole && TOP_OFFICES.has(committeeRole)) {
      const previousHolder = await ctx.db
        .query("members")
        .withIndex("by_committeeRole", (q) => q.eq("committeeRole", committeeRole))
        .first();
      if (previousHolder && previousHolder._id !== memberId) {
        await ctx.db.patch(previousHolder._id, { committeeRole: undefined });
        if (previousHolder.userId) {
          await ctx.db.patch(previousHolder.userId, {
            committeeRole: undefined,
            role: "member",
          });
        }
      }
    }

    const wasTopOffice = member.committeeRole ? TOP_OFFICES.has(member.committeeRole) : false;
    const willBeTopOffice = committeeRole ? TOP_OFFICES.has(committeeRole) : false;

    await ctx.db.patch(memberId, { committeeRole });

    if (willBeTopOffice) {
      await ctx.db.patch(member.userId, { committeeRole, role: "super_admin" });
    } else if (wasTopOffice) {
      // Stepping down from chairman/deputy — back to an ordinary member.
      await ctx.db.patch(member.userId, { committeeRole, role: "member" });
    } else {
      await ctx.db.patch(member.userId, { committeeRole });
    }

    await logAction(ctx, {
      userId: admin._id,
      action: "member.setCommitteeRole",
      entityType: "member",
      entityId: memberId,
      details: { committeeRole: committeeRole ?? null },
    });
  },
});
