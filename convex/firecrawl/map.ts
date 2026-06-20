"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { getFirecrawlClient } from "./client";

type SitemapMode = "include" | "skip" | "only";

export const map = action({
  args: {
    url: v.string(),
    limit: v.optional(v.number()),
    sitemap: v.optional(v.string()),
    search: v.optional(v.string()),
    location: v.optional(v.any()),
    includeSubdomains: v.optional(v.boolean()),
    ignoreQueryParameters: v.optional(v.boolean()),
    timeout: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const normalizedUrl = args.url.trim();
    if (!normalizedUrl) {
      throw new Error("url is required and must be a string");
    }

    try {
      new URL(normalizedUrl);
    } catch {
      throw new Error("Invalid URL format");
    }

    const parsedLimit =
      typeof args.limit === "number" &&
      Number.isFinite(args.limit) &&
      args.limit > 0
        ? Math.min(args.limit, 100000)
        : undefined;

    if (args.limit !== undefined && parsedLimit === undefined) {
      throw new Error("limit must be a positive number");
    }

    if (
      args.timeout !== undefined &&
      (!Number.isFinite(args.timeout) || args.timeout < 0)
    ) {
      throw new Error("timeout must be a non-negative number");
    }

    const sitemapMode: SitemapMode =
      args.sitemap === "include" ||
      args.sitemap === "skip" ||
      args.sitemap === "only"
        ? args.sitemap
        : "include";

    const firecrawl = getFirecrawlClient();
    const result = (await firecrawl.map(normalizedUrl, {
      ...(parsedLimit !== undefined ? { limit: parsedLimit } : {}),
      ...(args.sitemap ? { sitemap: sitemapMode } : {}),
      ...(args.search ? { search: args.search } : {}),
      ...(args.location ? { location: args.location } : {}),
      ...(args.includeSubdomains !== undefined
        ? { includeSubdomains: args.includeSubdomains }
        : {}),
      ...(args.ignoreQueryParameters !== undefined
        ? { ignoreQueryParameters: args.ignoreQueryParameters }
        : {}),
      ...(args.timeout !== undefined ? { timeout: args.timeout } : {}),
    })) as unknown as Record<string, unknown>;

    return {
      success: result.success !== false,
      links: result.links,
      ...result,
    };
  },
});
