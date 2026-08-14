import { v } from "convex/values";
import { mutation, action, internalMutation, internalQuery } from "../_generated/server";
import { createAccount } from "@convex-dev/auth/server";
import { normalizeNationalId } from "../../lib/national-id";
import { normalizeKenyanPhone } from "../../lib/phone";
import { requireAdmin } from "../authz";
import { logAction, logSystemAction } from "../audit";
import { notify } from "../notifications/helpers";
import { internal } from "../_generated/api";

const genderValidator = v.union(
  v.literal("male"),
  v.literal("female"),
  v.literal("other")
);

// Public — reachable from the logged-out "Sign up" tab on the landing page.
// Creates the auth account right away (so the password is hashed straight
// into authAccounts, never stored in plain text anywhere) but leaves it
// isActive:false and role-less until an admin approves.
export const submit = action({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    nationalId: v.string(),
    registrationNumber: v.string(),
    password: v.string(),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args): Promise<{ ok: boolean }> => {
    const nationalId = normalizeNationalId(args.nationalId);

    const duplicate = await ctx.runQuery(
      internal.membershipApplications.mutations.findDuplicate,
      { nationalId }
    );
    if (duplicate === "member") {
      throw new Error("A member with this National ID is already registered.");
    }
    if (duplicate === "application") {
      throw new Error(
        "An application with this National ID is already pending review."
      );
    }

    const { user } = await createAccount(ctx, {
      provider: "password",
      account: { id: nationalId, secret: args.password },
      profile: {
        email: nationalId,
        nationalId,
        name: `${args.firstName} ${args.lastName}`,
        isActive: false,
        applicationStatus: "pending",
      },
    });

    await ctx.runMutation(internal.membershipApplications.mutations.recordApplication, {
      userId: user._id,
      firstName: args.firstName,
      lastName: args.lastName,
      nationalId,
      registrationNumber: args.registrationNumber,
    });

    return { ok: true };
  },
});

export const findDuplicate = internalQuery({
  args: { nationalId: v.string() },
  handler: async (ctx, { nationalId }) => {
    const member = await ctx.db
      .query("members")
      .withIndex("by_nationalId", (q) => q.eq("nationalId", nationalId))
      .first();
    if (member) return "member" as const;

    const application = await ctx.db
      .query("membershipApplications")
      .withIndex("by_nationalId", (q) => q.eq("nationalId", nationalId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();
    if (application) return "application" as const;

    return null;
  },
});

export const recordApplication = internalMutation({
  args: {
    userId: v.id("users"),
    firstName: v.string(),
    lastName: v.string(),
    nationalId: v.string(),
    registrationNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const applicationId = await ctx.db.insert("membershipApplications", {
      ...args,
      status: "pending",
    });

    await logSystemAction(ctx, {
      action: "membershipApplication.submit",
      entityType: "membershipApplication",
      entityId: applicationId,
      details: { name: `${args.firstName} ${args.lastName}` },
    });

    const admins = await ctx.db.query("users").collect();
    for (const admin of admins) {
      if (admin.role === "super_admin" || admin.role === "admin") {
        await notify(ctx, {
          recipientUserId: admin._id,
          title: "New membership application",
          message: `${args.firstName} ${args.lastName} applied to join the Sacco.`,
          type: "system",
          relatedEntityType: "membershipApplication",
          relatedEntityId: applicationId,
        });
      }
    }
  },
});

const approveArgs = {
  applicationId: v.id("membershipApplications"),
  middleName: v.optional(v.string()),
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

export const approve = mutation({
  args: approveArgs,
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const application = await ctx.db.get(args.applicationId);
    if (!application) throw new Error("Application not found");
    if (application.status !== "pending") {
      throw new Error("This application has already been reviewed");
    }

    const phone = normalizeKenyanPhone(args.phoneNumber);

    const phoneTaken = await ctx.db
      .query("members")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", phone))
      .first();
    if (phoneTaken) {
      throw new Error("A member with this phone number is already registered.");
    }

    const result = await ctx.runMutation(internal.members.mutations.createMemberRecord, {
      firstName: application.firstName,
      lastName: application.lastName,
      middleName: args.middleName,
      nationalId: application.nationalId,
      phoneNumber: phone,
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
      userId: application.userId,
      registeredBy: admin._id,
    });

    await ctx.db.patch(application.userId, {
      role: "member",
      isActive: true,
      applicationStatus: undefined,
    });

    await ctx.db.patch(args.applicationId, {
      status: "approved",
      reviewedBy: admin._id,
      reviewedAt: new Date().toISOString(),
    });

    await notify(ctx, {
      recipientUserId: application.userId,
      title: "Application approved",
      message: "Your membership application has been approved. You can now sign in.",
      type: "system",
      relatedEntityType: "member",
      relatedEntityId: result.memberId,
    });

    await logAction(ctx, {
      userId: admin._id,
      action: "membershipApplication.approve",
      entityType: "membershipApplication",
      entityId: args.applicationId,
      details: { memberId: result.memberId },
    });
  },
});

export const reject = mutation({
  args: { applicationId: v.id("membershipApplications"), reason: v.string() },
  handler: async (ctx, { applicationId, reason }) => {
    const admin = await requireAdmin(ctx);
    const application = await ctx.db.get(applicationId);
    if (!application) throw new Error("Application not found");
    if (application.status !== "pending") {
      throw new Error("This application has already been reviewed");
    }

    await ctx.db.patch(applicationId, {
      status: "rejected",
      reviewedBy: admin._id,
      reviewedAt: new Date().toISOString(),
      rejectionReason: reason,
    });

    await ctx.db.patch(application.userId, { applicationStatus: "rejected" });

    await notify(ctx, {
      recipientUserId: application.userId,
      title: "Application declined",
      message: `Your membership application was declined: ${reason}`,
      type: "system",
      relatedEntityType: "membershipApplication",
      relatedEntityId: applicationId,
    });

    await logAction(ctx, {
      userId: admin._id,
      action: "membershipApplication.reject",
      entityType: "membershipApplication",
      entityId: applicationId,
      details: { reason },
    });
  },
});
