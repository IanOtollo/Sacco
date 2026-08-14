import { getAuthUserId } from "@convex-dev/auth/server";
import { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

type DbCtx = QueryCtx | MutationCtx;

export async function getCurrentUserDoc(
  ctx: DbCtx
): Promise<Doc<"users"> | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  return await ctx.db.get(userId);
}

export async function requireUser(ctx: DbCtx): Promise<Doc<"users">> {
  const user = await getCurrentUserDoc(ctx);
  if (!user) throw new Error("Not authenticated");
  if (user.isActive === false) throw new Error("Account suspended");
  return user;
}

export async function requireAdmin(ctx: DbCtx): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (user.role !== "super_admin" && user.role !== "admin") {
    throw new Error("Admin access required");
  }
  return user;
}

export async function requireSuperAdmin(ctx: DbCtx): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (user.role !== "super_admin") {
    throw new Error("Super admin access required");
  }
  return user;
}

export async function requireMember(ctx: DbCtx): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (user.role !== "member" || !user.memberId) {
    throw new Error("Member access required");
  }
  return user;
}

// Actions don't have ctx.db, so role checks route through the public
// getCurrentUser query instead.
export async function requireAdminInAction(
  ctx: ActionCtx
): Promise<Doc<"users">> {
  const user = await ctx.runQuery(api.users.getCurrentUser, {});
  if (!user) throw new Error("Not authenticated");
  if (user.isActive === false) throw new Error("Account suspended");
  if (user.role !== "super_admin" && user.role !== "admin") {
    throw new Error("Admin access required");
  }
  return user;
}
