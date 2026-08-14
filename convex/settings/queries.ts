import { query } from "../_generated/server";
import { requireUser } from "../authz";
import { SETTINGS_DEFINITIONS } from "./definitions";

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
