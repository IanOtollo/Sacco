import { v } from "convex/values";
import { action } from "./_generated/server";
import {
  getAuthUserId,
  modifyAccountCredentials,
  retrieveAccount,
} from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";
import { assertValidPassword } from "../lib/password";

// Used by the forced password-change modal shown to members/admins on
// their first login (default passwords are system-generated, see
// members/helpers.ts generateDefaultPassword).
export const completeForcedPasswordChange = action({
  args: { newPassword: v.string() },
  handler: async (ctx, { newPassword }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    assertValidPassword(newPassword);

    const user = await ctx.runQuery(api.users.getCurrentUser, {});
    if (!user || !user.email) {
      throw new Error("No login ID on file for this account");
    }

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: user.email, secret: newPassword },
    });

    await ctx.runMutation(internal.users.setFirstLoginComplete, { userId });
    await ctx.runMutation(internal.users.logPasswordChange, {
      userId,
      action: "auth.forcedPasswordChange",
    });
  },
});

// Voluntary password change from the profile page — requires the current
// password.
export const changePassword = action({
  args: { currentPassword: v.string(), newPassword: v.string() },
  handler: async (ctx, { currentPassword, newPassword }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    assertValidPassword(newPassword);

    const user = await ctx.runQuery(api.users.getCurrentUser, {});
    if (!user || !user.email) {
      throw new Error("No login ID on file for this account");
    }

    // retrieveAccount doesn't return a falsy value on a wrong password —
    // it throws "InvalidSecret" (or "InvalidAccountId"/"TooManyFailedAttempts")
    // — so the check has to happen in a catch, not on the return value.
    try {
      await retrieveAccount(ctx, {
        provider: "password",
        account: { id: user.email, secret: currentPassword },
      });
    } catch (error) {
      if (error instanceof Error && error.message === "TooManyFailedAttempts") {
        throw new Error("Too many attempts. Please try again later.");
      }
      throw new Error("Current password is incorrect");
    }

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: user.email, secret: newPassword },
    });

    await ctx.runMutation(internal.users.logPasswordChange, {
      userId,
      action: "auth.changePassword",
    });
  },
});
