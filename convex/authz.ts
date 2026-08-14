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

// Chairman/deputy carry role "super_admin" but still have a personal member
// profile — anyone (of any role) with a linked memberId can reach the
// member portal to view/manage their own account.
export async function requireMemberProfile(ctx: DbCtx): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (!user.memberId) {
    throw new Error("Member access required");
  }
  return user;
}

// Treasurer gets extra financial modules (contributions, dividends,
// financial reports) inside the member portal, on top of whatever admins
// can already do.
export async function requireTreasurer(ctx: DbCtx): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  const isAdmin = user.role === "super_admin" || user.role === "admin";
  if (!isAdmin && user.committeeRole !== "treasurer") {
    throw new Error("Treasurer access required");
  }
  return user;
}

// Secretary gets extra communication modules (announcements) inside the
// member portal, on top of whatever admins can already do.
export async function requireSecretary(ctx: DbCtx): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  const isAdmin = user.role === "super_admin" || user.role === "admin";
  if (!isAdmin && user.committeeRole !== "secretary") {
    throw new Error("Secretary access required");
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
