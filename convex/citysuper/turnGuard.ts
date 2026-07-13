import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import {
  citysuperProductUrlKey,
  citysuperProductValidator,
  type CitysuperStoredProduct,
} from "./productValidators";

/** Reset search allowance at the start of each assistant generation turn. */
export const resetCitysuperSearchTurn = internalMutation({
  args: {
    threadId: v.string(),
    promptMessageId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { threadId, promptMessageId }) => {
    await ctx.db.insert("citysuperSearchTurns", {
      threadId,
      promptMessageId,
      searchCount: 0,
    });
    return null;
  },
});

/**
 * Allow at most one citysuperSearch per user message turn (per thread).
 * Throws if the agent already searched in this turn.
 */
export const acquireCitysuperSearch = internalMutation({
  args: {
    threadId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { threadId }) => {
    const turn = await ctx.db
      .query("citysuperSearchTurns")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .order("desc")
      .first();

    if (!turn) {
      return null;
    }

    if (turn.searchCount >= 1) {
      throw new Error(
        "Only one citysuperSearch is allowed per user message. " +
          "Use the products from your previous search, call showCitysuperProducts with your picks, " +
          "or use page/page_count on a single search instead of searching again with a different query.",
      );
    }

    await ctx.db.patch(turn._id, { searchCount: turn.searchCount + 1 });
    return null;
  },
});

/** Persist scraped products so showCitysuperProducts can hydrate real data. */
export const saveCitysuperSearchProducts = internalMutation({
  args: {
    threadId: v.string(),
    products: v.array(citysuperProductValidator),
  },
  returns: v.null(),
  handler: async (ctx, { threadId, products }) => {
    const turn = await ctx.db
      .query("citysuperSearchTurns")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .order("desc")
      .first();

    if (!turn) {
      return null;
    }

    await ctx.db.patch(turn._id, { products });
    return null;
  },
});

/**
 * Resolve showCitysuperProducts picks against the latest search in this thread.
 * Returns hydrated product rows (from search) plus optional notes from the agent.
 */
export const resolveShowCitysuperProducts = internalQuery({
  args: {
    threadId: v.string(),
    picks: v.array(
      v.object({
        product_url: v.string(),
        note: v.optional(v.string()),
      }),
    ),
  },
  returns: v.object({
    products: v.array(
      v.object({
        position: v.optional(v.number()),
        name: v.string(),
        brand: v.optional(v.string()),
        product_url: v.string(),
        image_url: v.optional(v.string()),
        regular_price_hkd: v.optional(v.number()),
        sale_price_hkd: v.optional(v.number()),
        currency: v.optional(v.string()),
        size: v.optional(v.string()),
        availability: v.optional(v.string()),
        note: v.optional(v.string()),
      }),
    ),
  }),
  handler: async (ctx, { threadId, picks }) => {
    const turn = await ctx.db
      .query("citysuperSearchTurns")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .order("desc")
      .first();

    const cached = turn?.products ?? [];
    if (cached.length === 0) {
      throw new Error(
        "No citysuperSearch results for this turn. Call citysuperSearch first, " +
          "then showCitysuperProducts using product_url values from that search only.",
      );
    }

    const byUrl = new Map<string, CitysuperStoredProduct>();
    for (const product of cached) {
      byUrl.set(citysuperProductUrlKey(product.product_url), product);
    }

    const missing: string[] = [];
    const products: Array<CitysuperStoredProduct & { note?: string }> = [];

    for (const pick of picks) {
      const key = citysuperProductUrlKey(pick.product_url);
      const matched = byUrl.get(key);
      if (!matched) {
        missing.push(pick.product_url);
        continue;
      }
      products.push({
        ...matched,
        ...(pick.note?.trim() ? { note: pick.note.trim() } : {}),
      });
    }

    if (missing.length > 0) {
      const sample = cached
        .slice(0, 5)
        .map((p) => p.product_url)
        .join("\n");
      throw new Error(
        `showCitysuperProducts only accepts product_url values from the latest citysuperSearch. ` +
          `${missing.length} pick(s) were not in the search results (do not invent URLs). ` +
          `Valid examples:\n${sample}`,
      );
    }

    return { products };
  },
});
