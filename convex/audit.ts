import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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
}
