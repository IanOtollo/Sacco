import { v } from "convex/values";
import { mutation, action, internalMutation, internalQuery } from "../_generated/server";
import { createAccount } from "@convex-dev/auth/server";
import { normalizeNationalId } from "../../lib/national-id";
import { normalizeKenyanPhone } from "../../lib/phone";
import { requireAdmin } from "../authz";
import { logAction, logSystemAction } from "../audit";
import { notify } from "../notifications/helpers";
import { internal } from "../_generated/api";
import { Doc } from "../_generated/dataModel";

const genderValidator = v.union(v.literal("male"), v.literal("female"));

// Public — reachable from the logged-out "Sign up" tab on the landing page.
// Creates the auth account right away (so the password is hashed straight
// into authAccounts, never stored in plain text here) but leaves it
// isActive:false and role-less until an admin approves.
export const submit = action({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    nationalId: v.string(),
    phoneNumber: v.string(),
    gender: genderValidator,
    registrationNumber: v.string(),
    password: v.string(),
    // Existing member the applicant credits with inviting them, picked from
    // the search box on the sign-up form. Optional — not everyone was
    // referred.
    invitorMemberId: v.optional(v.id("members")),
    // Honeypot — real users never see or fill this field; bots that
    // auto-fill every input do. Silently no-op if it's non-empty.
    website: v.optional(v.string()),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args): Promise<{ ok: boolean }> => {
    if (args.website) {
      return { ok: true };
    }

    const nationalId = normalizeNationalId(args.nationalId);
    const phone = normalizeKenyanPhone(args.phoneNumber);

    const duplicate = await ctx.runQuery(
      internal.membershipApplications.mutations.findDuplicate,
      { nationalId, phoneNumber: phone }
    );
    if (duplicate === "member") {
      throw new Error("A member with this National ID or phone number is already registered.");
    }
    if (duplicate === "application") {
      throw new Error(
        "An application with this National ID or phone number is already pending review."
      );
    }

    const { user } = await createAccount(ctx, {
      provider: "password",
      account: { id: nationalId, secret: args.password },
      profile: {
        email: nationalId,
        nationalId,
        phone,
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
      phoneNumber: phone,
      gender: args.gender,
      registrationNumber: args.registrationNumber,
      invitorMemberId: args.invitorMemberId,
    });

    return { ok: true };
  },
});

export const findDuplicate = internalQuery({
  args: { nationalId: v.string(), phoneNumber: v.optional(v.string()) },
  handler: async (ctx, { nationalId, phoneNumber }) => {
    // Non-member loan placeholders (isNonMember: true) don't count as a
    // registered member here — someone who's only ever been recorded as a
    // non-member borrower is still registering for the first time. Their
    // placeholder row gets upgraded into a real member on approval instead
    // of blocking them — see approve() below.
    const memberById = await ctx.db
      .query("members")
      .withIndex("by_nationalId", (q) => q.eq("nationalId", nationalId))
      .first();
    if (memberById && !memberById.isNonMember) return "member" as const;

    if (phoneNumber) {
      const memberByPhone = await ctx.db
        .query("members")
        .withIndex("by_phone", (q) => q.eq("phoneNumber", phoneNumber))
        .first();
      if (memberByPhone && !memberByPhone.isNonMember) return "member" as const;
    }

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
    phoneNumber: v.string(),
    gender: genderValidator,
    registrationNumber: v.string(),
    invitorMemberId: v.optional(v.id("members")),
  },
  handler: async (ctx, args) => {
    // Validate softly — a stale/invalid invitor pick shouldn't block the
    // whole application, it just gets dropped.
    let invitorMemberId = args.invitorMemberId;
    if (invitorMemberId) {
      const invitor = await ctx.db.get(invitorMemberId);
      if (!invitor || invitor.status !== "active" || invitor.isNonMember) {
        invitorMemberId = undefined;
      }
    }

    const applicationId = await ctx.db.insert("membershipApplications", {
      ...args,
      invitorMemberId,
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

// The invitor's cut of the registration fee — fixed, regardless of what the
// fee itself is set to (see settings financial.registrationFee). Whatever's
// left of the fee is the Sacco's share.
const INVITOR_REGISTRATION_COMMISSION = 200;

// Admin just reads what the applicant already provided and confirms — no
// re-keying of phone/gender, and next of kin is left for the member to add
// themselves later from their own profile (see members.mutations.update).
// Also requires the admin to explicitly confirm the registration fee was
// received — membership can't be activated without it.
export const approve = mutation({
  args: {
    applicationId: v.id("membershipApplications"),
    confirmFeeReceived: v.boolean(),
  },
  handler: async (ctx, { applicationId, confirmFeeReceived }) => {
    const admin = await requireAdmin(ctx);
    const application = await ctx.db.get(applicationId);
    if (!application) throw new Error("Application not found");
    if (application.status !== "pending") {
      throw new Error("This application has already been reviewed");
    }
    if (!confirmFeeReceived) {
      throw new Error("Confirm the registration fee was received before approving");
    }

    // A non-member loan placeholder with this National ID gets upgraded into
    // the real member record on approval, instead of a second row being
    // created — see members.mutations.createMemberRecord. Anything else
    // (a real member, or a placeholder under a different identity) blocks.
    const existingByNationalId = await ctx.db
      .query("members")
      .withIndex("by_nationalId", (q) => q.eq("nationalId", application.nationalId))
      .first();
    if (existingByNationalId && !existingByNationalId.isNonMember) {
      throw new Error("A member with this National ID is already registered.");
    }

    const phoneTaken = await ctx.db
      .query("members")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", application.phoneNumber))
      .first();
    if (phoneTaken && phoneTaken._id !== existingByNationalId?._id) {
      throw new Error("A member with this phone number is already registered.");
    }

    let invitor: Doc<"members"> | null = null;
    if (application.invitorMemberId) {
      invitor = await ctx.db.get(application.invitorMemberId);
    }

    const result = await ctx.runMutation(internal.members.mutations.createMemberRecord, {
      firstName: application.firstName,
      lastName: application.lastName,
      nationalId: application.nationalId,
      phoneNumber: application.phoneNumber,
      gender: application.gender,
      userId: application.userId,
      registeredBy: admin._id,
      invitedBy: invitor?._id,
      upgradeMemberId: existingByNationalId?.isNonMember ? existingByNationalId._id : undefined,
    });

    await ctx.db.patch(application.userId, {
      role: "member",
      isActive: true,
      applicationStatus: undefined,
    });

    await ctx.db.patch(applicationId, {
      status: "approved",
      reviewedBy: admin._id,
      reviewedAt: new Date().toISOString(),
      registrationFeeConfirmed: true,
    });

    const feeSetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "financial.registrationFee"))
      .first();
    const registrationFee = Number(feeSetting?.value ?? 500);
    // Clamp so a fee configured below the invitor's fixed cut can never
    // send the Sacco's share negative.
    const invitorCommission = Math.min(INVITOR_REGISTRATION_COMMISSION, registrationFee);
    const saccoShare = registrationFee - invitorCommission;

    if (invitor) {
      await ctx.db.insert("commissions", {
        memberId: invitor._id,
        type: "registration",
        amount: invitorCommission,
        description: `Referral — ${application.firstName} ${application.lastName} joined`,
        relatedMemberId: result.memberId,
        applicationId,
        status: "pending",
      });

      if (invitor.userId) {
        await notify(ctx, {
          recipientUserId: invitor.userId,
          title: "Referral commission earned",
          message: `KES ${invitorCommission.toLocaleString()} commission earned — ${application.firstName} ${application.lastName} joined using your invite.`,
          type: "system",
          relatedEntityType: "member",
          relatedEntityId: result.memberId,
          actionUrl: "/portal",
        });
      }
    }

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
      entityId: applicationId,
      details: {
        memberId: result.memberId,
        registrationFee,
        invitorMemberId: invitor?._id,
        invitorCommission: invitor ? invitorCommission : 0,
        saccoShare: invitor ? saccoShare : registrationFee,
      },
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
