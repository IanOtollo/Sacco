import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireAdmin, requireMemberProfile, requireUser } from "../authz";
import { logAction } from "../audit";
import { notify } from "../notifications/helpers";
import {
  generateLoanNumber,
  calculateLoanSchedule,
  calculateBulletLoan,
  resolveEmergencyLoanRate,
  resolveDevelopmentLoanRate,
} from "./helpers";
import { generateReferenceNumber } from "../accounts/helpers";
import { generateNonMemberNumber } from "../members/helpers";
import { normalizeKenyanPhone } from "../../lib/phone";
import { normalizeNationalId } from "../../lib/national-id";

// Admin-issued loan for someone who is not a Sacco member — identified by
// name, phone, and National ID rather than a member picker. Skips the
// guarantor workflow entirely (guarantors are fellow members vouching;
// non-members provide collateral instead) but still goes through the same
// approve → disburse steps as any other loan for a second set of eyes on
// the money movement. Two products, priced differently:
// - Emergency: a flat, one-time charge banded by how many days the loan
//   runs (up to 4 weeks), repaid as a single lump sum — see
//   resolveEmergencyLoanRate / calculateBulletLoan.
// - Development: a flat charge that climbs 4 points per month of term,
//   repaid in monthly installments like a member loan — see
//   resolveDevelopmentLoanRate.
export const issueNonMemberLoan = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    phoneNumber: v.string(),
    nationalId: v.string(),
    principalAmount: v.number(),
    category: v.union(v.literal("emergency"), v.literal("development")),
    termDays: v.optional(v.number()),
    termMonths: v.optional(v.number()),
    purpose: v.string(),
    collateralDescription: v.string(),
    collateralValue: v.number(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const product = await ctx.db
      .query("loanProducts")
      .withIndex("by_code", (q) => q.eq("code", "NMEM"))
      .first();
    if (!product || !product.isActive) {
      throw new Error(
        "Non-member loan product is not set up — run the applyFlatInterestRules migration"
      );
    }
    if (
      args.principalAmount < product.minimumAmount ||
      args.principalAmount > product.maximumAmount
    ) {
      throw new Error(
        `Amount must be between KES ${product.minimumAmount.toLocaleString()} and KES ${product.maximumAmount.toLocaleString()}`
      );
    }
    if (!args.collateralDescription.trim()) {
      throw new Error("Collateral description is required for non-member loans");
    }

    let interestRate: number;
    let termMonths: bigint;
    let termDays: bigint | undefined;

    if (args.category === "emergency") {
      const days = args.termDays;
      if (!days || !Number.isInteger(days) || days < 1 || days > 28) {
        throw new Error("Emergency loans run for a whole number of days, up to 28");
      }
      interestRate = resolveEmergencyLoanRate(days);
      termMonths = BigInt(Math.max(1, Math.ceil(days / 30)));
      termDays = BigInt(days);
    } else {
      const months = args.termMonths;
      if (!months || !Number.isInteger(months) || months < 1 || months > 60) {
        throw new Error("Development loans run for a whole number of months, up to 60");
      }
      interestRate = resolveDevelopmentLoanRate(months);
      termMonths = BigInt(months);
      termDays = undefined;
    }

    const phone = normalizeKenyanPhone(args.phoneNumber);
    const nationalId = normalizeNationalId(args.nationalId);

    // Reuse an existing person's record (member or a prior non-member
    // borrower) if the National ID already matches one, rather than
    // creating a duplicate — so repeat borrowers accumulate one history.
    const existing = await ctx.db
      .query("members")
      .withIndex("by_nationalId", (q) => q.eq("nationalId", nationalId))
      .first();

    let memberId = existing?._id;
    if (!memberId) {
      const memberNumber = await generateNonMemberNumber(ctx);
      memberId = await ctx.db.insert("members", {
        memberNumber,
        firstName: args.firstName,
        lastName: args.lastName,
        nationalId,
        phoneNumber: phone,
        dateJoined: new Date().toISOString().slice(0, 10),
        status: "active",
        registeredBy: admin._id,
        isNonMember: true,
      });
    }

    const loanNumber = await generateLoanNumber(ctx, product.code);

    const loanId = await ctx.db.insert("loans", {
      loanNumber,
      memberId,
      productId: product._id,
      principalAmount: args.principalAmount,
      interestAmount: 0,
      totalRepayable: args.principalAmount,
      processingFee: 0,
      insuranceFee: 0,
      amountDisbursed: 0,
      monthlyRepayment: 0,
      termMonths,
      termDays,
      nonMemberLoanCategory: args.category,
      interestRate,
      purpose: args.purpose,
      totalPaid: 0,
      outstandingBalance: 0,
      arrearsAmount: 0,
      status: "pending_approval",
      appliedAt: new Date().toISOString(),
      collateralDescription: args.collateralDescription,
      collateralValue: args.collateralValue,
    });

    await logAction(ctx, {
      userId: admin._id,
      action: "loan.issueNonMember",
      entityType: "loan",
      entityId: loanId,
      details: {
        loanNumber,
        amount: args.principalAmount,
        category: args.category,
        termDays: args.termDays,
        termMonths: args.termMonths,
        interestRate,
        borrowerName: `${args.firstName} ${args.lastName}`,
      },
    });

    return { loanId, loanNumber, memberId };
  },
});

export const apply = mutation({
  args: {
    productId: v.id("loanProducts"),
    principalAmount: v.number(),
    termMonths: v.number(),
    purpose: v.string(),
    guarantorMemberIds: v.array(v.id("members")),
  },
  handler: async (ctx, args) => {
    const caller = await requireMemberProfile(ctx);
    const memberId = caller.memberId!;

    const member = await ctx.db.get(memberId);
    if (!member) throw new Error("Member not found");
    if (member.status !== "active") {
      throw new Error("Only active members can apply for loans");
    }

    const product = await ctx.db.get(args.productId);
    if (!product || !product.isActive || product.code === "NMEM") {
      throw new Error("Loan product not available");
    }

    if (
      args.principalAmount < product.minimumAmount ||
      args.principalAmount > product.maximumAmount
    ) {
      throw new Error(
        `Amount must be between KES ${product.minimumAmount.toLocaleString()} and KES ${product.maximumAmount.toLocaleString()}`
      );
    }
    if (
      args.termMonths < product.minimumTermMonths ||
      args.termMonths > product.maximumTermMonths
    ) {
      throw new Error(
        `Term must be between ${product.minimumTermMonths} and ${product.maximumTermMonths} months`
      );
    }

    const existingLoans = await ctx.db
      .query("loans")
      .withIndex("by_member", (q) => q.eq("memberId", memberId))
      .collect();
    if (existingLoans.some((l) => l.status === "defaulted")) {
      throw new Error("Members with a defaulted loan cannot apply for new loans");
    }

    const savingsAccount = await ctx.db
      .query("accounts")
      .withIndex("by_member_type", (q) =>
        q.eq("memberId", memberId).eq("type", "savings")
      )
      .first();
    const savingsBalance = savingsAccount?.balance ?? 0;
    const maxByRatio = savingsBalance * product.maxLoanToSavingsRatio;
    if (args.principalAmount > maxByRatio) {
      throw new Error(
        `Amount exceeds ${product.maxLoanToSavingsRatio}x your savings balance (max KES ${maxByRatio.toLocaleString()})`
      );
    }

    if (args.guarantorMemberIds.includes(memberId)) {
      throw new Error("You cannot guarantee your own loan");
    }
    if (args.guarantorMemberIds.length < Number(product.requiredGuarantors)) {
      throw new Error(
        `This product requires ${product.requiredGuarantors} guarantor(s)`
      );
    }

    const interestAmount = 0; // computed at disbursement once schedule is generated
    const loanNumber = await generateLoanNumber(ctx, product.code);

    // Guarantors are informational only — the borrower has already arranged
    // this with them offline, so they're recorded straight away rather than
    // routed through an accept/decline step. The loan goes straight to the
    // admin review queue.
    const loanId = await ctx.db.insert("loans", {
      loanNumber,
      memberId,
      productId: product._id,
      principalAmount: args.principalAmount,
      interestAmount,
      totalRepayable: args.principalAmount,
      processingFee: 0,
      insuranceFee: 0,
      amountDisbursed: 0,
      monthlyRepayment: 0,
      termMonths: BigInt(args.termMonths),
      interestRate: product.interestRate,
      purpose: args.purpose,
      totalPaid: 0,
      outstandingBalance: 0,
      arrearsAmount: 0,
      status: "pending_approval",
      appliedAt: new Date().toISOString(),
    });

    const now = new Date().toISOString();
    for (const guarantorMemberId of args.guarantorMemberIds) {
      const guarantorMember = await ctx.db.get(guarantorMemberId);
      if (!guarantorMember) continue;

      await ctx.db.insert("guarantors", {
        loanId,
        guarantorMemberId,
        borrowerMemberId: memberId,
        amountGuaranteed: args.principalAmount / args.guarantorMemberIds.length,
        status: "accepted",
        respondedAt: now,
      });

      if (guarantorMember.userId) {
        await notify(ctx, {
          recipientUserId: guarantorMember.userId,
          title: "You've been listed as a guarantor",
          message: `${member.firstName} ${member.lastName} has listed you as a guarantor for their ${product.name} of KES ${args.principalAmount.toLocaleString()}.`,
          type: "guarantor_request",
          relatedEntityType: "loan",
          relatedEntityId: loanId,
          actionUrl: "/portal/guarantors",
        });
      }
    }

    const admins = await ctx.db.query("users").collect();
    for (const a of admins) {
      if (a.role === "admin" || a.role === "super_admin") {
        await notify(ctx, {
          recipientUserId: a._id,
          title: "New loan application",
          message: `${member.firstName} ${member.lastName} applied for a ${product.name} of KES ${args.principalAmount.toLocaleString()}.`,
          type: "loan_update",
          relatedEntityType: "loan",
          relatedEntityId: loanId,
          actionUrl: `/admin/loans/${loanId}`,
        });
      }
    }

    await logAction(ctx, {
      userId: caller._id,
      action: "loan.apply",
      entityType: "loan",
      entityId: loanId,
      details: { loanNumber, amount: args.principalAmount },
    });

    return { loanId, loanNumber };
  },
});

export const approve = mutation({
  args: { loanId: v.id("loans"), notes: v.optional(v.string()) },
  handler: async (ctx, { loanId, notes }) => {
    const admin = await requireAdmin(ctx);
    const loan = await ctx.db.get(loanId);
    if (!loan) throw new Error("Loan not found");
    if (loan.status !== "pending_approval") {
      throw new Error("Only loans pending approval can be approved");
    }

    await ctx.db.patch(loanId, {
      status: "approved",
      approvedBy: admin._id,
      approvedAt: new Date().toISOString(),
    });

    const member = await ctx.db.get(loan.memberId);
    if (member?.userId) {
      await notify(ctx, {
        recipientUserId: member.userId,
        title: "Loan approved",
        message: `Your loan of KES ${loan.principalAmount.toLocaleString()} has been approved.`,
        type: "loan_update",
        relatedEntityType: "loan",
        relatedEntityId: loanId,
        actionUrl: `/portal/loans/${loanId}`,
      });
    }

    await logAction(ctx, {
      userId: admin._id,
      action: "loan.approve",
      entityType: "loan",
      entityId: loanId,
      details: { notes },
    });
  },
});

export const reject = mutation({
  args: { loanId: v.id("loans"), reason: v.string() },
  handler: async (ctx, { loanId, reason }) => {
    const admin = await requireAdmin(ctx);
    const loan = await ctx.db.get(loanId);
    if (!loan) throw new Error("Loan not found");
    if (!["pending_guarantors", "pending_approval"].includes(loan.status)) {
      throw new Error("This loan cannot be rejected in its current state");
    }

    await ctx.db.patch(loanId, { status: "rejected", rejectionReason: reason });

    const member = await ctx.db.get(loan.memberId);
    if (member?.userId) {
      await notify(ctx, {
        recipientUserId: member.userId,
        title: "Loan application declined",
        message: `Your loan application was declined: ${reason}`,
        type: "loan_update",
        relatedEntityType: "loan",
        relatedEntityId: loanId,
        actionUrl: `/portal/loans/${loanId}`,
      });
    }

    await logAction(ctx, {
      userId: admin._id,
      action: "loan.reject",
      entityType: "loan",
      entityId: loanId,
      details: { reason },
    });
  },
});

export const disburse = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const admin = await requireAdmin(ctx);
    const loan = await ctx.db.get(loanId);
    if (!loan) throw new Error("Loan not found");
    if (loan.status !== "approved") {
      throw new Error("Only approved loans can be disbursed");
    }

    const product = await ctx.db.get(loan.productId);
    if (!product) throw new Error("Loan product not found");

    const disbursementDate = new Date();

    // Non-member loans (loan.termDays set) are priced as a single lump sum
    // banded by term length rather than a product-configured monthly rate.
    let interestRate = loan.interestRate;
    let totalInterest: number;
    let totalRepayable: number;
    let monthlyRepayment: number;
    let installments: { installmentNumber: number; dueDate: string; principalDue: number; interestDue: number; totalDue: number }[];
    let maturityDateStr: string;

    if (loan.termDays != null) {
      const bullet = calculateBulletLoan({
        principal: loan.principalAmount,
        termDays: Number(loan.termDays),
        interestRate: loan.interestRate,
        disbursementDate,
      });
      interestRate = bullet.interestRate;
      totalInterest = bullet.totalInterest;
      totalRepayable = bullet.totalRepayable;
      monthlyRepayment = bullet.totalRepayable;
      installments = bullet.installments;
      maturityDateStr = bullet.dueDate;
    } else {
      const schedule = calculateLoanSchedule({
        principal: loan.principalAmount,
        annualRatePercent: loan.interestRate,
        termMonths: Number(loan.termMonths),
        method: product.interestMethod,
        disbursementDate,
        gracePeriodDays: Number(product.gracePeriodDays),
      });
      totalInterest = schedule.totalInterest;
      totalRepayable = schedule.totalRepayable;
      monthlyRepayment = schedule.monthlyRepayment;
      installments = schedule.installments;
      const maturityDate = new Date(disbursementDate);
      maturityDate.setMonth(maturityDate.getMonth() + Number(loan.termMonths));
      maturityDateStr = maturityDate.toISOString().slice(0, 10);
    }

    const processingFee = round2(
      loan.principalAmount * (product.processingFeePercent / 100)
    );
    const insuranceFee = round2(
      loan.principalAmount * ((product.insuranceFeePercent ?? 0) / 100)
    );
    const amountDisbursed = round2(
      loan.principalAmount - processingFee - insuranceFee
    );

    await ctx.db.patch(loanId, {
      status: "active",
      interestRate,
      interestAmount: totalInterest,
      totalRepayable,
      processingFee,
      insuranceFee,
      amountDisbursed,
      monthlyRepayment,
      outstandingBalance: totalRepayable,
      disbursementDate: disbursementDate.toISOString().slice(0, 10),
      maturityDate: maturityDateStr,
      disbursedBy: admin._id,
    });

    for (const installment of installments) {
      await ctx.db.insert("loanSchedule", {
        loanId,
        installmentNumber: BigInt(installment.installmentNumber),
        dueDate: installment.dueDate,
        principalDue: installment.principalDue,
        interestDue: installment.interestDue,
        totalDue: installment.totalDue,
        amountPaid: 0,
        status: "upcoming",
        penaltyAmount: 0,
      });
    }

    // Non-member borrowers have no savings account to credit — they're
    // handed the disbursed amount directly (cash/mpesa/bank), so there's
    // nothing to post here beyond the loan record + audit log below.
    const savingsAccount = await ctx.db
      .query("accounts")
      .withIndex("by_member_type", (q) =>
        q.eq("memberId", loan.memberId).eq("type", "savings")
      )
      .first();

    if (savingsAccount) {
      const balanceBefore = savingsAccount.balance;
      const balanceAfter = balanceBefore + amountDisbursed;
      await ctx.db.patch(savingsAccount._id, { balance: balanceAfter });

      await ctx.db.insert("transactions", {
        accountId: savingsAccount._id,
        memberId: loan.memberId,
        type: "loan_disbursement",
        amount: amountDisbursed,
        balanceBefore,
        balanceAfter,
        description: `Loan disbursement — ${loan.loanNumber}`,
        referenceNumber: generateReferenceNumber(),
        relatedLoanId: loanId,
        processedBy: admin._id,
        channel: "system",
        status: "completed",
      });
    }

    const member = await ctx.db.get(loan.memberId);
    if (member?.userId) {
      await notify(ctx, {
        recipientUserId: member.userId,
        title: "Loan disbursed",
        message: `KES ${amountDisbursed.toLocaleString()} has been credited to your savings account.`,
        type: "loan_update",
        relatedEntityType: "loan",
        relatedEntityId: loanId,
        actionUrl: `/portal/loans/${loanId}`,
      });
    }

    await logAction(ctx, {
      userId: admin._id,
      action: "loan.disburse",
      entityType: "loan",
      entityId: loanId,
      details: { amountDisbursed },
    });
  },
});

export const repay = mutation({
  args: {
    loanId: v.id("loans"),
    amount: v.number(),
    channel: v.optional(
      v.union(v.literal("cash"), v.literal("mpesa"), v.literal("bank_transfer"))
    ),
  },
  handler: async (ctx, { loanId, amount, channel }) => {
    const caller = await requireUser(ctx);
    const loan = await ctx.db.get(loanId);
    if (!loan) throw new Error("Loan not found");

    const isSelf = caller.role === "member" && caller.memberId === loan.memberId;
    const isAdmin = caller.role === "admin" || caller.role === "super_admin";
    if (!isSelf && !isAdmin) throw new Error("Not authorized");

    if (!["active", "disbursed"].includes(loan.status)) {
      throw new Error("This loan is not currently active");
    }
    if (amount <= 0) throw new Error("Amount must be greater than zero");

    // Non-member borrowers have no savings account — their repayments are
    // fresh cash/mpesa/bank funds applied straight to the loan, not a debit
    // against an internal balance the way a member's repayment works.
    const savingsAccount = await ctx.db
      .query("accounts")
      .withIndex("by_member_type", (q) =>
        q.eq("memberId", loan.memberId).eq("type", "savings")
      )
      .first();
    if (savingsAccount && savingsAccount.balance < amount) {
      throw new Error("Insufficient savings balance to make this repayment");
    }

    const schedule = await ctx.db
      .query("loanSchedule")
      .withIndex("by_loan", (q) => q.eq("loanId", loanId))
      .collect();
    schedule.sort((a, b) => Number(a.installmentNumber) - Number(b.installmentNumber));

    let remaining = amount;
    for (const installment of schedule) {
      if (remaining <= 0) break;
      if (installment.status === "paid") continue;

      const due = installment.totalDue - installment.amountPaid;
      const applied = Math.min(due, remaining);
      const newAmountPaid = round2(installment.amountPaid + applied);
      const fullyPaid = newAmountPaid >= installment.totalDue - 0.01;

      await ctx.db.patch(installment._id, {
        amountPaid: newAmountPaid,
        status: fullyPaid ? "paid" : "partial",
        datePaid: fullyPaid ? new Date().toISOString().slice(0, 10) : installment.datePaid,
      });

      remaining = round2(remaining - applied);
    }

    if (savingsAccount) {
      const balanceBefore = savingsAccount.balance;
      const balanceAfter = round2(balanceBefore - amount);
      await ctx.db.patch(savingsAccount._id, { balance: balanceAfter });

      await ctx.db.insert("transactions", {
        accountId: savingsAccount._id,
        memberId: loan.memberId,
        type: "loan_repayment",
        amount,
        balanceBefore,
        balanceAfter,
        description: `Loan repayment — ${loan.loanNumber}`,
        referenceNumber: generateReferenceNumber(),
        relatedLoanId: loanId,
        processedBy: isAdmin ? caller._id : undefined,
        channel: channel ?? "system",
        status: "completed",
      });
    }

    const newTotalPaid = round2(loan.totalPaid + amount);
    const newOutstanding = round2(Math.max(loan.outstandingBalance - amount, 0));
    const fullyPaidLoan = newOutstanding <= 0.01;

    await ctx.db.patch(loanId, {
      totalPaid: newTotalPaid,
      outstandingBalance: newOutstanding,
      status: fullyPaidLoan ? "fully_paid" : "active",
    });

    const member = await ctx.db.get(loan.memberId);
    if (member?.userId) {
      await notify(ctx, {
        recipientUserId: member.userId,
        title: fullyPaidLoan ? "Loan fully repaid" : "Repayment received",
        message: fullyPaidLoan
          ? `Your loan ${loan.loanNumber} has been fully repaid. Congratulations!`
          : `A repayment of KES ${amount.toLocaleString()} was applied to ${loan.loanNumber}.`,
        type: "payment_received",
        relatedEntityType: "loan",
        relatedEntityId: loanId,
        actionUrl: `/portal/loans/${loanId}`,
      });
    }

    // Referral commission — whoever invited this borrower to the Sacco
    // earns 25% of every repayment they make, for the life of the loan.
    if (member?.invitedBy) {
      const invitor = await ctx.db.get(member.invitedBy);
      const commission = round2(amount * 0.25);
      if (invitor && commission > 0) {
        await ctx.db.insert("commissions", {
          memberId: invitor._id,
          type: "loan_repayment",
          amount: commission,
          description: `Referral — ${member.firstName} ${member.lastName} repaid ${loan.loanNumber}`,
          relatedMemberId: member._id,
          loanId,
          status: "pending",
        });

        if (invitor.userId) {
          await notify(ctx, {
            recipientUserId: invitor.userId,
            title: "Referral commission earned",
            message: `KES ${commission.toLocaleString()} commission earned from ${member.firstName} ${member.lastName}'s loan repayment.`,
            type: "system",
            relatedEntityType: "loan",
            relatedEntityId: loanId,
            actionUrl: "/portal",
          });
        }
      }
    }

    await logAction(ctx, {
      userId: caller._id,
      action: "loan.repay",
      entityType: "loan",
      entityId: loanId,
      details: { amount },
    });
  },
});

export const writeOff = mutation({
  args: { loanId: v.id("loans"), reason: v.string() },
  handler: async (ctx, { loanId, reason }) => {
    const admin = await requireAdmin(ctx);
    const loan = await ctx.db.get(loanId);
    if (!loan) throw new Error("Loan not found");

    await ctx.db.patch(loanId, { status: "written_off" });

    const member = await ctx.db.get(loan.memberId);
    if (member?.userId) {
      await notify(ctx, {
        recipientUserId: member.userId,
        title: "Loan written off",
        message: `Your loan ${loan.loanNumber} has been written off by the Sacco.`,
        type: "loan_update",
        relatedEntityType: "loan",
        relatedEntityId: loanId,
      });
    }

    await logAction(ctx, {
      userId: admin._id,
      action: "loan.writeOff",
      entityType: "loan",
      entityId: loanId,
      details: { reason },
    });
  },
});

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
