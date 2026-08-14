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

export function generateDefaultPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}
