import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

const NOTIFICATION_TYPES = [
  "loan_update",
  "guarantor_request",
  "payment_received",
  "payment_due",
  "account_update",
  "announcement",
  "system",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export async function notify(
  ctx: MutationCtx,
  args: {
    recipientUserId: Id<"users">;
    title: string;
    message: string;
    type: NotificationType;
    relatedEntityType?: string;
    relatedEntityId?: string;
    actionUrl?: string;
  }
) {
  await ctx.db.insert("notifications", {
    recipientUserId: args.recipientUserId,
    title: args.title,
    message: args.message,
    type: args.type,
    isRead: false,
    relatedEntityType: args.relatedEntityType,
    relatedEntityId: args.relatedEntityId,
    actionUrl: args.actionUrl,
  });
}
