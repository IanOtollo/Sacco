import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { normalizeNationalId } from "../lib/national-id";
import { isValidPassword, PASSWORD_MIN_LENGTH } from "../lib/password";

// Members and admins sign in with their National ID / registration number
// and a password. Convex Auth's Password provider is built around an
// `email` identifier field, so we normalize the ID number and store it
// there — it also gets mirrored onto `nationalId` on `users` for display
// without a join back to `members`.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        if (params.flow === "signUp") {
          throw new Error(
            "Public sign-up is disabled. Contact your Sacco administrator for an account."
          );
        }
        const nationalId = normalizeNationalId(params.nationalId as string);
        return { email: nationalId, nationalId };
      },
      validatePasswordRequirements(password: string) {
        if (!isValidPassword(password)) {
          throw new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
        }
      },
    }),
  ],
});
