import "server-only";
import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@/convex/_generated/api";

export async function getCurrentUserServer() {
  const token = await convexAuthNextjsToken();
  if (!token) return null;
  return await fetchQuery(api.users.getCurrentUser, {}, { token });
}
