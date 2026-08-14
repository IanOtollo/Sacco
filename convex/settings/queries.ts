import { query } from "../_generated/server";
import { requireUser } from "../authz";
import { SETTINGS_DEFINITIONS } from "./definitions";

// Public — the Sacco's display name is shown on the unauthenticated
// landing/login pages too, so this intentionally skips requireUser.
export const getSaccoName = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "sacco.name"))
      .first();
    return row?.value || SETTINGS_DEFINITIONS["sacco.name"].default;
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const rows = await ctx.db.query("settings").collect();
    const byKey = new Map(rows.map((r) => [r.key, r.value]));

    return Object.entries(SETTINGS_DEFINITIONS).map(([key, def]) => ({
      key,
      description: def.description,
      value: byKey.get(key) ?? def.default,
    }));
  },
});
