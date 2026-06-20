"use node";

import { v } from "convex/values";
import type Firecrawl from "@mendable/firecrawl-js";
import { action } from "../_generated/server";
import { getFirecrawlClient } from "./client";

export const scrape = action({
  args: {
    url: v.string(),
    maxAge: v.optional(v.number()),
    storeInCache: v.optional(v.boolean()),
    actions: v.optional(v.any()),
    schema: v.optional(v.any()),
    prompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { url, maxAge, storeInCache, actions, schema, prompt } = args;

    try {
      new URL(url);
    } catch {
      throw new Error("Invalid URL format");
    }

    const firecrawl = getFirecrawlClient();
    type ScrapeOptions = NonNullable<Parameters<Firecrawl["scrape"]>[1]>;
    type FormatOption = NonNullable<ScrapeOptions["formats"]>[number];

    const formats: FormatOption[] = ["markdown", "links"];

    if (schema || prompt) {
      formats.push({
        type: "json",
        ...(schema ? { schema } : {}),
        ...(prompt ? { prompt } : {}),
      });
    }

    const scrapeResult = (await firecrawl.scrape(url, {
      formats,
      ...(Array.isArray(actions) && actions.length > 0 ? { actions } : {}),
      excludeTags: ["script", "style", "noscript", "iframe"],
      onlyMainContent: true,
      maxAge: maxAge ?? 172800000,
      storeInCache: storeInCache ?? true,
      timeout: 120000,
    })) as Record<string, unknown>;

    if (scrapeResult.success === false && scrapeResult.error) {
      throw new Error(`Scrape failed: ${String(scrapeResult.error)}`);
    }

    return {
      success: true,
      markdown: scrapeResult.markdown,
      html: scrapeResult.html,
      rawHtml: scrapeResult.rawHtml,
      json: scrapeResult.json ?? null,
      metadata: scrapeResult.metadata,
      screenshot: scrapeResult.screenshot,
      links: scrapeResult.links,
      actions: scrapeResult.actions,
    };
  },
});
