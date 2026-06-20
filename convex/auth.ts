// convex/auth.ts
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { CustomPassword } from "./CustomPassword";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [CustomPassword, GitHub, Google],
});
