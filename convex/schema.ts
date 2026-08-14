import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── AUTH (Convex Auth tables, inlined + extended) ─────────
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // ─ Sacco-specific fields ─
    role: v.optional(
      v.union(v.literal("super_admin"), v.literal("admin"), v.literal("member"))
    ),
    memberId: v.optional(v.id("members")),
    isFirstLogin: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  authSessions: defineTable({
    userId: v.id("users"),
    expirationTime: v.number(),
  }).index("userId", ["userId"]),

  authAccounts: defineTable({
    userId: v.id("users"),
    provider: v.string(),
    providerAccountId: v.string(),
    secret: v.optional(v.string()),
    emailVerified: v.optional(v.string()),
    phoneVerified: v.optional(v.string()),
  })
    .index("userIdAndProvider", ["userId", "provider"])
    .index("providerAndAccountId", ["provider", "providerAccountId"]),

  authRefreshTokens: defineTable({
    sessionId: v.id("authSessions"),
    expirationTime: v.number(),
    firstUsedTime: v.optional(v.number()),
    parentRefreshTokenId: v.optional(v.id("authRefreshTokens")),
  })
    .index("sessionId", ["sessionId"])
    .index("sessionIdAndParentRefreshTokenId", [
      "sessionId",
      "parentRefreshTokenId",
    ]),

  authVerificationCodes: defineTable({
    accountId: v.id("authAccounts"),
    provider: v.string(),
    code: v.string(),
    expirationTime: v.number(),
    verifier: v.optional(v.string()),
    emailVerified: v.optional(v.string()),
    phoneVerified: v.optional(v.string()),
  })
    .index("accountId", ["accountId"])
    .index("code", ["code"]),

  authVerifiers: defineTable({
    sessionId: v.optional(v.id("authSessions")),
    signature: v.optional(v.string()),
  }).index("signature", ["signature"]),

  authRateLimits: defineTable({
    identifier: v.string(),
    lastAttemptTime: v.number(),
    attemptsLeft: v.number(),
  }).index("identifier", ["identifier"]),

  // ─── MEMBERS ──────────────────────────────────────
  members: defineTable({
    memberNumber: v.string(), // SACCO-0001
    firstName: v.string(),
    lastName: v.string(),
    middleName: v.optional(v.string()),
    nationalId: v.string(), // Kenyan ID number
    phoneNumber: v.string(), // canonical +254XXXXXXXXX, used for login
    email: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
    occupation: v.optional(v.string()),
    employer: v.optional(v.string()),
    postalAddress: v.optional(v.string()),
    residentialAddress: v.optional(v.string()),
    nextOfKinName: v.string(),
    nextOfKinPhone: v.string(),
    nextOfKinRelationship: v.string(),
    profilePhoto: v.optional(v.id("_storage")),
    dateJoined: v.string(), // ISO date
    status: v.union(
      v.literal("active"),
      v.literal("suspended"),
      v.literal("dormant"),
      v.literal("exited")
    ),
    userId: v.optional(v.id("users")),
    registeredBy: v.id("users"),
  })
    .index("by_memberNumber", ["memberNumber"])
    .index("by_nationalId", ["nationalId"])
    .index("by_phone", ["phoneNumber"])
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_userId", ["userId"]),

  // ─── ACCOUNTS ─────────────────────────────────────
  accounts: defineTable({
    memberId: v.id("members"),
    type: v.union(v.literal("savings"), v.literal("shares")),
    accountNumber: v.string(), // SAV-SACCO-0001 or SHR-SACCO-0001
    balance: v.float64(),
    minimumBalance: v.float64(),
    isActive: v.boolean(),
  })
    .index("by_member", ["memberId"])
    .index("by_member_type", ["memberId", "type"])
    .index("by_accountNumber", ["accountNumber"]),

  // ─── TRANSACTIONS ─────────────────────────────────
  transactions: defineTable({
    accountId: v.id("accounts"),
    memberId: v.id("members"),
    type: v.union(
      v.literal("deposit"),
      v.literal("withdrawal"),
      v.literal("loan_disbursement"),
      v.literal("loan_repayment"),
      v.literal("share_purchase"),
      v.literal("share_withdrawal"),
      v.literal("dividend_credit"),
      v.literal("interest_charge"),
      v.literal("penalty"),
      v.literal("registration_fee"),
      v.literal("transfer")
    ),
    amount: v.float64(),
    balanceBefore: v.float64(),
    balanceAfter: v.float64(),
    description: v.string(),
    referenceNumber: v.string(), // TXN-20260813-XXXXX
    relatedLoanId: v.optional(v.id("loans")),
    processedBy: v.optional(v.id("users")),
    channel: v.union(
      v.literal("cash"),
      v.literal("mpesa"),
      v.literal("bank_transfer"),
      v.literal("system")
    ),
    status: v.union(
      v.literal("completed"),
      v.literal("pending"),
      v.literal("reversed"),
      v.literal("failed")
    ),
    receiptNumber: v.optional(v.string()),
    narration: v.optional(v.string()),
  })
    .index("by_account", ["accountId"])
    .index("by_member", ["memberId"])
    .index("by_type", ["type"])
    .index("by_reference", ["referenceNumber"])
    .index("by_status", ["status"]),

  // ─── LOAN PRODUCTS ────────────────────────────────
  loanProducts: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.string(),
    interestRate: v.float64(),
    interestMethod: v.union(
      v.literal("reducing_balance"),
      v.literal("flat_rate")
    ),
    minimumAmount: v.float64(),
    maximumAmount: v.float64(),
    minimumTermMonths: v.int64(),
    maximumTermMonths: v.int64(),
    requiredGuarantors: v.int64(),
    maxLoanToSavingsRatio: v.float64(),
    processingFeePercent: v.float64(),
    insuranceFeePercent: v.optional(v.float64()),
    gracePeriodDays: v.int64(),
    penaltyRatePercent: v.float64(),
    isActive: v.boolean(),
    createdBy: v.id("users"),
  })
    .index("by_code", ["code"])
    .index("by_active", ["isActive"]),

  // ─── LOANS ────────────────────────────────────────
  loans: defineTable({
    loanNumber: v.string(), // LN-NRM-20260813-0001
    memberId: v.id("members"),
    productId: v.id("loanProducts"),
    principalAmount: v.float64(),
    interestAmount: v.float64(),
    totalRepayable: v.float64(),
    processingFee: v.float64(),
    insuranceFee: v.float64(),
    amountDisbursed: v.float64(),
    monthlyRepayment: v.float64(),
    termMonths: v.int64(),
    interestRate: v.float64(),
    purpose: v.string(),
    disbursementDate: v.optional(v.string()),
    maturityDate: v.optional(v.string()),
    totalPaid: v.float64(),
    outstandingBalance: v.float64(),
    arrearsAmount: v.float64(),
    status: v.union(
      v.literal("draft"),
      v.literal("pending_guarantors"),
      v.literal("pending_approval"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("disbursed"),
      v.literal("active"),
      v.literal("fully_paid"),
      v.literal("defaulted"),
      v.literal("written_off")
    ),
    rejectionReason: v.optional(v.string()),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.string()),
    disbursedBy: v.optional(v.id("users")),
    appliedAt: v.string(),
  })
    .index("by_member", ["memberId"])
    .index("by_product", ["productId"])
    .index("by_status", ["status"])
    .index("by_loanNumber", ["loanNumber"]),

  // ─── LOAN REPAYMENT SCHEDULE ──────────────────────
  loanSchedule: defineTable({
    loanId: v.id("loans"),
    installmentNumber: v.int64(),
    dueDate: v.string(),
    principalDue: v.float64(),
    interestDue: v.float64(),
    totalDue: v.float64(),
    amountPaid: v.float64(),
    datePaid: v.optional(v.string()),
    status: v.union(
      v.literal("upcoming"),
      v.literal("paid"),
      v.literal("partial"),
      v.literal("overdue"),
      v.literal("waived")
    ),
    penaltyAmount: v.float64(),
  })
    .index("by_loan", ["loanId"])
    .index("by_status", ["status"])
    .index("by_dueDate", ["dueDate"]),

  // ─── GUARANTORS ───────────────────────────────────
  guarantors: defineTable({
    loanId: v.id("loans"),
    guarantorMemberId: v.id("members"),
    borrowerMemberId: v.id("members"),
    amountGuaranteed: v.float64(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined")
    ),
    respondedAt: v.optional(v.string()),
    remarks: v.optional(v.string()),
  })
    .index("by_loan", ["loanId"])
    .index("by_guarantor", ["guarantorMemberId"])
    .index("by_borrower", ["borrowerMemberId"])
    .index("by_status", ["status"]),

  // ─── CONTRIBUTION TYPES (folders) ─────────────────
  // Contributions can be for many different purposes (monthly savings,
  // building fund, AGM fund, emergency relief, etc). Each type is its own
  // "folder" — contribution records are always scoped to exactly one type
  // and never mix with another type's records.
  contributionTypes: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
  }).index("by_name", ["name"]),

  contributions: defineTable({
    contributionTypeId: v.id("contributionTypes"),
    memberId: v.id("members"),
    amount: v.float64(),
    month: v.optional(v.string()), // optional label, e.g. "2026-08"
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("partial"),
      v.literal("defaulted")
    ),
    paidAt: v.optional(v.string()),
    receiptNumber: v.optional(v.string()),
    processedBy: v.optional(v.id("users")),
  })
    .index("by_type", ["contributionTypeId"])
    .index("by_member", ["memberId"])
    .index("by_type_member", ["contributionTypeId", "memberId"])
    .index("by_status", ["status"]),

  // ─── DIVIDENDS ────────────────────────────────────
  dividends: defineTable({
    financialYear: v.string(), // "2025-2026"
    totalPool: v.float64(),
    ratePercent: v.float64(),
    declaredDate: v.string(),
    status: v.union(
      v.literal("declared"),
      v.literal("processing"),
      v.literal("distributed"),
      v.literal("cancelled")
    ),
    declaredBy: v.id("users"),
  })
    .index("by_year", ["financialYear"])
    .index("by_status", ["status"]),

  dividendPayouts: defineTable({
    dividendId: v.id("dividends"),
    memberId: v.id("members"),
    sharesBalance: v.float64(),
    amount: v.float64(),
    creditedToAccount: v.id("accounts"),
    status: v.union(
      v.literal("pending"),
      v.literal("credited"),
      v.literal("failed")
    ),
  })
    .index("by_dividend", ["dividendId"])
    .index("by_member", ["memberId"]),

  // ─── NOTIFICATIONS ────────────────────────────────
  notifications: defineTable({
    recipientUserId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("loan_update"),
      v.literal("guarantor_request"),
      v.literal("payment_received"),
      v.literal("payment_due"),
      v.literal("account_update"),
      v.literal("announcement"),
      v.literal("system")
    ),
    isRead: v.boolean(),
    relatedEntityType: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
  })
    .index("by_recipient", ["recipientUserId"])
    .index("by_recipient_read", ["recipientUserId", "isRead"])
    .index("by_type", ["type"]),

  // ─── ANNOUNCEMENTS / UPDATES ──────────────────────
  announcements: defineTable({
    title: v.string(),
    content: v.string(),
    priority: v.union(
      v.literal("normal"),
      v.literal("important"),
      v.literal("urgent")
    ),
    targetAudience: v.union(
      v.literal("all"),
      v.literal("members"),
      v.literal("admins")
    ),
    publishedAt: v.optional(v.string()),
    expiresAt: v.optional(v.string()),
    isPublished: v.boolean(),
    authorId: v.id("users"),
    attachments: v.optional(v.array(v.id("_storage"))),
  })
    .index("by_published", ["isPublished"])
    .index("by_audience", ["targetAudience"])
    .index("by_priority", ["priority"]),

  // ─── AUDIT LOG ────────────────────────────────────
  auditLog: defineTable({
    userId: v.id("users"),
    action: v.string(), // "member.create", "loan.approve", etc.
    entityType: v.string(),
    entityId: v.string(),
    details: v.string(), // JSON string of before/after or context
    ipAddress: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_action", ["action"])
    .index("by_entity", ["entityType", "entityId"]),

  // ─── SACCO SETTINGS ──────────────────────────────
  settings: defineTable({
    key: v.string(),
    value: v.string(), // JSON-encoded value
    description: v.string(),
    updatedBy: v.id("users"),
  }).index("by_key", ["key"]),
});
