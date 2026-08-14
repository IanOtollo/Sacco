import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { normalizeKenyanPhone } from "../lib/phone";
import { isValidPin } from "../lib/pin";

// Members and admins sign in with their phone number and a 4-digit PIN.
// Convex Auth's Password provider is built around an `email` identifier
// field, so we normalize the phone number and store it there — the
// `phone` field on `users` is also populated for display/lookup use
// elsewhere in the app.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        if (params.flow === "signUp") {
          throw new Error(
            "Public sign-up is disabled. Contact your Sacco administrator for an account."
          );
        }
        const phone = normalizeKenyanPhone(params.phone as string);
        return { email: phone, phone };
      },
      validatePasswordRequirements(pin: string) {
        if (!isValidPin(pin)) {
          throw new Error("PIN must be exactly 4 digits.");
        }
      },
    }),
  ],
});
