import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

const isRedirectIfAuthenticated = createRouteMatcher([
  // "/",
  "/login",
  "/signup",
]);

const isProtectedRoute = createRouteMatcher([
  "/dashboard",
  "/(api|trpc)(.*)",
  "/chat(.*)",
  "/map",
]);

export default convexAuthNextjsMiddleware(
  async (request, { convexAuth }) => {
    if (
      isRedirectIfAuthenticated(request) &&
      (await convexAuth.isAuthenticated())
    ) {
      return nextjsMiddlewareRedirect(request, "/dashboard");
    }

    if (isProtectedRoute(request) && !(await convexAuth.isAuthenticated())) {
      return nextjsMiddlewareRedirect(request, "/login");
    }
  },
  {
    cookieConfig: {
      maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    },
  },
);

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/dashboard", "/(api|trpc)(.*)"],
};
