import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireSuperAdmin } from "../authz";
import { logAction } from "../audit";
import { SETTINGS_DEFINITIONS, SettingsKey } from "./definitions";

export const setMany = mutation({
  args: {
    entries: v.array(v.object({ key: v.string(), value: v.string() })),
  },
  handler: async (ctx, { entries }) => {
    const admin = await requireSuperAdmin(ctx);

    for (const { key, value } of entries) {
      const def = SETTINGS_DEFINITIONS[key as SettingsKey];
      if (!def) continue;

      const existing = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, { value, updatedBy: admin._id });
      } else {
        await ctx.db.insert("settings", {
          key,
          value,
          description: def.description,
          updatedBy: admin._id,
        });
      }
    }

    await logAction(ctx, {
      userId: admin._id,
      action: "settings.update",
      entityType: "settings",
      entityId: "bulk",
      details: { keys: entries.map((e) => e.key) },
    });
  },
});
