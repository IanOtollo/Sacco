import { v } from "convex/values";
import { query } from "../_generated/server";
import {
  getPrivacyPolicySections,
  getTermsOfServiceSections,
  sectionsToMarkdown,
} from "../../lib/legal-content";

const DOC_TITLES: Record<string, string> = {
  privacy_policy: "Privacy Policy",
  terms_of_service: "Terms of Service",
};

function defaultContent(key: "privacy_policy" | "terms_of_service", saccoName: string) {
  return key === "privacy_policy"
    ? sectionsToMarkdown(getPrivacyPolicySections(saccoName))
    : sectionsToMarkdown(getTermsOfServiceSections(saccoName));
}

// Public — these are shown on the unauthenticated landing page.
export const getDocument = query({
  args: {
    key: v.union(v.literal("privacy_policy"), v.literal("terms_of_service")),
  },
  handler: async (ctx, { key }) => {
    const row = await ctx.db
      .query("legalDocuments")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (row) {
      return {
        title: row.title,
        content: row.content,
        updatedAt: row.updatedAt,
      };
    }

    const saccoNameRow = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "sacco.name"))
      .first();
    const saccoName = saccoNameRow?.value || "Client Sacco";

    return {
      title: DOC_TITLES[key],
      content: defaultContent(key, saccoName),
      updatedAt: null,
    };
  },
});
