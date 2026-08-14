import { MutationCtx } from "../_generated/server";

export async function generateMemberNumber(ctx: MutationCtx): Promise<string> {
  const last = await ctx.db
    .query("members")
    .withIndex("by_memberNumber")
    .order("desc")
    .first();

  const lastSeq = last ? parseInt(last.memberNumber.split("-")[1], 10) : 0;
  const nextSeq = lastSeq + 1;
  return `SACCO-${String(nextSeq).padStart(4, "0")}`;
}

// Non-member borrowers get an EXT- prefixed identifier instead of a real
// membership number — "S" sorts after "E" so this never collides with
// generateMemberNumber's descending SACCO- lookup above.
export async function generateNonMemberNumber(ctx: MutationCtx): Promise<string> {
  const all = await ctx.db.query("members").withIndex("by_memberNumber").order("desc").collect();
  const last = all.find((m) => m.memberNumber.startsWith("EXT-"));
  const lastSeq = last ? parseInt(last.memberNumber.split("-")[1], 10) : 0;
  return `EXT-${String(lastSeq + 1).padStart(4, "0")}`;
}

const PASSWORD_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

// System-generated temporary password for a newly registered member —
// they're required to change it on first login (see ForcePasswordChange).
export function generateDefaultPassword(): string {
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += PASSWORD_CHARS[Math.floor(Math.random() * PASSWORD_CHARS.length)];
  }
  return out;
}
