import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { notify } from "./notifications/helpers";

export async function logAction(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    action: string;
    entityType: string;
    entityId: string;
    details?: unknown;
  }
) {
  await ctx.db.insert("auditLog", {
    userId: args.userId,
    action: args.action,
    entityType: args.entityType,
    entityId: args.entityId,
    details: JSON.stringify(args.details ?? {}),
  });

  await notifyChairmanIfDeputyAction(ctx, args);
}

// Oversight: whenever the deputy chairman makes or edits something, the
// chairman is notified so nothing happens without their awareness.
async function notifyChairmanIfDeputyAction(
  ctx: MutationCtx,
  args: { userId: Id<"users">; action: string; entityType: string; entityId: string }
) {
  const actor = await ctx.db.get(args.userId);
  if (!actor || actor.committeeRole !== "deputy_chairman") return;

  const chairman = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("committeeRole"), "chairman"))
    .first();
  if (!chairman) return;

  await notify(ctx, {
    recipientUserId: chairman._id,
    title: "Deputy chairman action",
    message: `${actor.name ?? "The deputy chairman"} performed "${args.action}" on ${args.entityType}.`,
    type: "system",
    relatedEntityType: args.entityType,
    relatedEntityId: args.entityId,
  });
}

// Cron jobs act with no signed-in user. Attribute their audit entries to a
// super_admin so every system-triggered change still leaves a footprint;
// skip logging (rather than throw) if no super_admin exists yet.
export async function logSystemAction(
  ctx: MutationCtx,
  args: {
    action: string;
    entityType: string;
    entityId: string;
    details?: unknown;
  }
) {
  const superAdmin = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("role"), "super_admin"))
    .first();
  if (!superAdmin) return;

  await logAction(ctx, { ...args, userId: superAdmin._id });
}
