// convex/CustomPassword.ts
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError } from "convex/values";

export const CustomPassword = Password({
  profile(params) {
    return {
      email: params.email as string,
      name: params.name as string,
    };
  },
  validatePasswordRequirements: (password: string) => {
    if (
      password.length < 8 ||
      !/\d/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password)
    ) {
      throw new ConvexError(
        "Password must be at least 8 characters long, and contain at least one number, one lowercase letter, and one uppercase letter.",
      );
    }
  },
});
