import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireSecretary } from "../authz";
import { logAction } from "../audit";
import { notify } from "../notifications/helpers";

const priorityValidator = v.union(
  v.literal("normal"),
  v.literal("important"),
  v.literal("urgent")
);
const audienceValidator = v.union(
  v.literal("all"),
  v.literal("members"),
  v.literal("admins")
);

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    priority: priorityValidator,
    targetAudience: audienceValidator,
    expiresAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireSecretary(ctx);
    const id = await ctx.db.insert("announcements", {
      ...args,
      isPublished: false,
      authorId: admin._id,
    });

    await logAction(ctx, {
      userId: admin._id,
      action: "announcement.create",
      entityType: "announcement",
      entityId: id,
      details: { title: args.title },
    });

    return id;
  },
});

export const update = mutation({
  args: {
    announcementId: v.id("announcements"),
    title: v.string(),
    content: v.string(),
    priority: priorityValidator,
    targetAudience: audienceValidator,
    expiresAt: v.optional(v.string()),
  },
  handler: async (ctx, { announcementId, ...args }) => {
    const admin = await requireSecretary(ctx);
    await ctx.db.patch(announcementId, args);

    await logAction(ctx, {
      userId: admin._id,
      action: "announcement.update",
      entityType: "announcement",
      entityId: announcementId,
      details: { title: args.title },
    });
  },
});

export const setPublished = mutation({
  args: { announcementId: v.id("announcements"), isPublished: v.boolean() },
  handler: async (ctx, { announcementId, isPublished }) => {
    const admin = await requireSecretary(ctx);
    const announcement = await ctx.db.get(announcementId);
    if (!announcement) throw new Error("Announcement not found");

    const wasPublished = announcement.isPublished;

    await ctx.db.patch(announcementId, {
      isPublished,
      publishedAt: isPublished
        ? (announcement.publishedAt ?? new Date().toISOString())
        : announcement.publishedAt,
    });

    if (isPublished && !wasPublished) {
      const users = await ctx.db.query("users").collect();
      for (const u of users) {
        const matchesAudience =
          announcement.targetAudience === "all" ||
          (announcement.targetAudience === "members" && u.role === "member") ||
          (announcement.targetAudience === "admins" &&
            (u.role === "admin" || u.role === "super_admin"));
        if (!matchesAudience) continue;

        await notify(ctx, {
          recipientUserId: u._id,
          title: announcement.title,
          message: announcement.content.slice(0, 140),
          type: "announcement",
          relatedEntityType: "announcement",
          relatedEntityId: announcementId,
          actionUrl:
            u.role === "member" ? "/portal/updates" : "/admin/announcements",
        });
      }
    }

    await logAction(ctx, {
      userId: admin._id,
      action: isPublished ? "announcement.publish" : "announcement.unpublish",
      entityType: "announcement",
      entityId: announcementId,
      details: {},
    });
  },
});

export const remove = mutation({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, { announcementId }) => {
    const admin = await requireSecretary(ctx);
    await ctx.db.delete(announcementId);

    await logAction(ctx, {
      userId: admin._id,
      action: "announcement.delete",
      entityType: "announcement",
      entityId: announcementId,
      details: {},
    });
  },
});
