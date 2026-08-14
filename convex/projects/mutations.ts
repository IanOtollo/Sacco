import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireAdmin } from "../authz";
import { logAction } from "../audit";

const statusValidator = v.union(
  v.literal("planning"),
  v.literal("active"),
  v.literal("completed"),
  v.literal("on_hold")
);

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    status: statusValidator,
    startDate: v.optional(v.string()),
    investmentAmount: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const projectId = await ctx.db.insert("projects", {
      ...args,
      createdBy: admin._id,
    });

    await logAction(ctx, {
      userId: admin._id,
      action: "project.create",
      entityType: "project",
      entityId: projectId,
      details: { name: args.name },
    });

    return { projectId };
  },
});

export const update = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    status: statusValidator,
    startDate: v.optional(v.string()),
    investmentAmount: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, ...patch }) => {
    const admin = await requireAdmin(ctx);
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");

    await ctx.db.patch(projectId, patch);

    await logAction(ctx, {
      userId: admin._id,
      action: "project.update",
      entityType: "project",
      entityId: projectId,
      details: { name: patch.name },
    });
  },
});

export const remove = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const admin = await requireAdmin(ctx);
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");

    await ctx.db.delete(projectId);

    await logAction(ctx, {
      userId: admin._id,
      action: "project.remove",
      entityType: "project",
      entityId: projectId,
      details: { name: project.name },
    });
  },
});
