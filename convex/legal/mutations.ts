import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireAdmin } from "../authz";
import { logAction } from "../audit";

const DOC_TITLES: Record<string, string> = {
  privacy_policy: "Privacy Policy",
  terms_of_service: "Terms of Service",
};

export const setDocument = mutation({
  args: {
    key: v.union(v.literal("privacy_policy"), v.literal("terms_of_service")),
    content: v.string(),
  },
  handler: async (ctx, { key, content }) => {
    const admin = await requireAdmin(ctx);
    const updatedAt = new Date().toISOString();

    const existing = await ctx.db
      .query("legalDocuments")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { content, updatedAt, updatedBy: admin._id });
    } else {
      await ctx.db.insert("legalDocuments", {
        key,
        title: DOC_TITLES[key],
        content,
        updatedAt,
        updatedBy: admin._id,
      });
    }

    await logAction(ctx, {
      userId: admin._id,
      action: "legalDocument.update",
      entityType: "legalDocument",
      entityId: key,
      details: {},
    });
  },
});
