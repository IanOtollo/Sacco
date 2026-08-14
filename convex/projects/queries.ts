import { query } from "../_generated/server";
import { requireAdmin, requireUser } from "../authz";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const projects = await ctx.db.query("projects").collect();
    return projects.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// Read-only view for members — same records, just no edit/delete access.
export const listForMembers = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const projects = await ctx.db.query("projects").collect();
    return projects.sort((a, b) => b._creationTime - a._creationTime);
  },
});
