import { v } from "convex/values";
import { action } from "./_generated/server";
import {
  getAuthUserId,
  modifyAccountCredentials,
  retrieveAccount,
} from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";
import { isValidPin } from "../lib/pin";

// Used by the forced PIN-change modal shown to members/admins on their
// first login (default PINs are system-generated, see
// members/helpers.ts generateDefaultPin).
export const completeForcedPinChange = action({
  args: { newPin: v.string() },
  handler: async (ctx, { newPin }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    if (!isValidPin(newPin)) {
      throw new Error("PIN must be exactly 4 digits.");
    }

    const user = await ctx.runQuery(api.users.getCurrentUser, {});
    if (!user || !user.email) {
      throw new Error("No phone number on file for this account");
    }

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: user.email, secret: newPin },
    });

    await ctx.runMutation(internal.users.setFirstLoginComplete, { userId });
    await ctx.runMutation(internal.users.logPinChange, {
      userId,
      action: "auth.forcedPinChange",
    });
  },
});

// Voluntary PIN change from the profile page — requires the current PIN.
export const changePin = action({
  args: { currentPin: v.string(), newPin: v.string() },
  handler: async (ctx, { currentPin, newPin }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    if (!isValidPin(newPin)) {
      throw new Error("PIN must be exactly 4 digits.");
    }

    const user = await ctx.runQuery(api.users.getCurrentUser, {});
    if (!user || !user.email) {
      throw new Error("No phone number on file for this account");
    }

    const verified = await retrieveAccount(ctx, {
      provider: "password",
      account: { id: user.email, secret: currentPin },
    });
    if (!verified) {
      throw new Error("Current PIN is incorrect");
    }

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: user.email, secret: newPin },
    });

    await ctx.runMutation(internal.users.logPinChange, {
      userId,
      action: "auth.changePin",
    });
  },
});
