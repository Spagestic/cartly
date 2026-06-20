"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { getFirecrawlClient } from "./client";

const VALID_SOURCES = new Set(["web", "images", "news"]);
const VALID_CATEGORIES = new Set(["github", "research", "pdf"]);

type SearchSource = "web" | "images" | "news";
type CategoryType = "github" | "research" | "pdf";
type SearchCategory = CategoryType | { type: CategoryType };

export const search = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    sources: v.optional(v.array(v.string())),
    categories: v.optional(v.array(v.union(v.string(), v.object({ type: v.string() })))),
    tbs: v.optional(v.string()),
    location: v.optional(v.string()),
    country: v.optional(v.string()),
    timeout: v.optional(v.number()),
    ignoreInvalidURLs: v.optional(v.boolean()),
    scrapeOptions: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const normalizedQuery = args.query?.trim();
    if (!normalizedQuery) {
      throw new Error("Valid query string is required");
    }

    const limit = args.limit ?? 5;
    if (limit < 1 || limit > 100) {
      throw new Error("limit must be between 1 and 100");
    }

    const sources = (args.sources ?? ["web"]) as SearchSource[];
    if (sources.some((source) => !VALID_SOURCES.has(source))) {
      throw new Error("Invalid sources. Must be one of: web, images, news");
    }

    const normalizedCategories = args.categories?.map((category) =>
      typeof category === "string"
        ? (category as CategoryType)
        : (category as SearchCategory & { type: CategoryType }).type,
    );

    if (
      normalizedCategories?.some((category) => !VALID_CATEGORIES.has(category))
    ) {
      throw new Error("Invalid categories. Must be one of: github, research, pdf");
    }

    const firecrawl = getFirecrawlClient();
    const searchOptions: Record<string, unknown> = {
      limit,
      sources,
      country: args.country ?? "US",
      timeout: args.timeout ?? 60000,
      ignoreInvalidURLs: args.ignoreInvalidURLs ?? false,
    };

    if (normalizedCategories && normalizedCategories.length > 0) {
      searchOptions.categories = normalizedCategories;
    }
    if (args.tbs) {
      searchOptions.tbs = args.tbs;
    }
    if (args.location) {
      searchOptions.location = args.location;
    }
    if (args.scrapeOptions) {
      searchOptions.scrapeOptions = args.scrapeOptions;
    }

    const result = await firecrawl.search(normalizedQuery, searchOptions);
    return {
      success: true,
      data: result,
    };
  },
});
