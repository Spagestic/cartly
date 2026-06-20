"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { getFirecrawlClient } from "./client";

export const crawl = action({
  args: {
    url: v.string(),
    maxDepth: v.optional(v.number()),
    maxPages: v.optional(v.number()),
    crawlOptions: v.optional(v.any()),
    pollInterval: v.optional(v.number()),
    timeout: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { url, ...options } = args;

    try {
      new URL(url);
    } catch {
      throw new Error("Invalid URL format");
    }

    const firecrawl = getFirecrawlClient();
    const normalizedTimeout = options.timeout ?? 600;

    if (normalizedTimeout < 1) {
      throw new Error("timeout must be greater than 0");
    }

    if (options.pollInterval !== undefined && options.pollInterval < 1) {
      throw new Error("pollInterval must be greater than 0");
    }

    const crawlOptions = (options.crawlOptions ?? {}) as Record<string, unknown>;
    const scrapeOptions =
      (crawlOptions.scrapeOptions as Record<string, unknown> | undefined) ??
      (Array.isArray(crawlOptions.formats)
        ? { formats: crawlOptions.formats }
        : undefined);

    const crawlRequest: Record<string, unknown> = {
      ...(Array.isArray(crawlOptions.includePaths)
        ? { includePaths: crawlOptions.includePaths }
        : {}),
      ...(Array.isArray(crawlOptions.excludePaths)
        ? { excludePaths: crawlOptions.excludePaths }
        : {}),
      ...(typeof crawlOptions.prompt === "string"
        ? { prompt: crawlOptions.prompt }
        : {}),
      ...(crawlOptions.maxDiscoveryDepth !== undefined ||
      options.maxDepth !== undefined
        ? { maxDiscoveryDepth: crawlOptions.maxDiscoveryDepth ?? options.maxDepth }
        : {}),
      ...(typeof crawlOptions.sitemap === "string"
        ? { sitemap: crawlOptions.sitemap }
        : {}),
      ...(typeof crawlOptions.ignoreQueryParameters === "boolean"
        ? { ignoreQueryParameters: crawlOptions.ignoreQueryParameters }
        : {}),
      ...(typeof crawlOptions.regexOnFullURL === "boolean"
        ? { regexOnFullURL: crawlOptions.regexOnFullURL }
        : {}),
      ...(crawlOptions.limit !== undefined || options.maxPages !== undefined
        ? { limit: crawlOptions.limit ?? options.maxPages }
        : {}),
      ...(typeof crawlOptions.crawlEntireDomain === "boolean"
        ? { crawlEntireDomain: crawlOptions.crawlEntireDomain }
        : {}),
      ...(typeof crawlOptions.allowExternalLinks === "boolean"
        ? { allowExternalLinks: crawlOptions.allowExternalLinks }
        : {}),
      ...(typeof crawlOptions.allowSubdomains === "boolean"
        ? { allowSubdomains: crawlOptions.allowSubdomains }
        : {}),
      ...(typeof crawlOptions.delay === "number"
        ? { delay: crawlOptions.delay }
        : {}),
      ...(typeof crawlOptions.maxConcurrency === "number"
        ? { maxConcurrency: crawlOptions.maxConcurrency }
        : {}),
      ...(typeof crawlOptions.webhook === "string"
        ? { webhook: crawlOptions.webhook }
        : {}),
      ...(typeof crawlOptions.zeroDataRetention === "boolean"
        ? { zeroDataRetention: crawlOptions.zeroDataRetention }
        : {}),
      ...(scrapeOptions ? { scrapeOptions } : {}),
      pollInterval: options.pollInterval ?? 2,
      timeout: normalizedTimeout,
    };

    const crawlResult = (await firecrawl.crawl(url, crawlRequest)) as unknown as Record<
      string,
      unknown
    >;

    if (crawlResult.success === false) {
      throw new Error(
        `Crawl failed: ${String(crawlResult.error ?? "Unknown error")}`,
      );
    }

    return {
      success: true,
      id: crawlResult.id as string | undefined,
      status: crawlResult.status,
      completed: crawlResult.completed,
      total: crawlResult.total,
      creditsUsed: crawlResult.creditsUsed,
      expiresAt: crawlResult.expiresAt,
      next: crawlResult.next,
      data: crawlResult.data,
    };
  },
});

export const getCrawlStatus = action({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const firecrawl = getFirecrawlClient();
    const status = (await firecrawl.getCrawlStatus(args.id)) as unknown as Record<
      string,
      unknown
    >;

    return {
      success: true,
      status: status.status,
      data: status.data,
      total: status.total,
      completed: status.completed,
      creditsUsed: status.creditsUsed,
    };
  },
});
