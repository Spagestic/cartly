import { z } from "zod";
import { createTool, type ToolCtx } from "@convex-dev/agent";
import { internal } from "./_generated/api";
import {
  CITYSUPER_LOCALES,
  CITYSUPER_MAX_PAGE_COUNT,
  CITYSUPER_SORT_OPTIONS,
} from "./citysuper/schema";

const citysuperSearchInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      "Product keywords only (e.g. 'extra virgin olive oil 500ml' or '特級初榨橄欖油'). " +
        "Do not include budget, HKD amounts, or 'best'—filter price after results. " +
        "One search per turn; do not run multiple searches with different keywords.",
    ),
  locale: z
    .enum(CITYSUPER_LOCALES)
    .optional()
    .describe(
      "Store locale: en (default, /search) or zh (/zh/search). Use zh when the user writes in Chinese; use en for English.",
    ),
  sort_by: z
    .enum(CITYSUPER_SORT_OPTIONS)
    .optional()
    .describe(
      "Prefer relevance (default)—best for finding the real product. " +
        "price-ascending/descending re-sorts relevance hits by price locally; " +
        "do not rely on Shopify price-sort (it ranks cheap accessories first). " +
        "For a budget, use relevance and filter prices yourself from results.",
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(48)
    .optional()
    .describe("Max products to return (default 24)."),
  page: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe(
      "First results page to scrape (default 1). Use page 2+ only when you need more results from the same query—not a new search.",
    ),
  page_count: z
    .number()
    .int()
    .min(1)
    .max(CITYSUPER_MAX_PAGE_COUNT)
    .optional()
    .describe(
      `How many consecutive pages to scrape starting at page (max ${CITYSUPER_MAX_PAGE_COUNT}). ` +
        "Prefer 1 unless the user needs a wider catalog slice.",
    ),
});

export const citysuperSearch = createTool({
  description:
    "Search City'super Hong Kong (online.citysuper.com.hk) once per user message. " +
    "Use locale zh for /zh/search (Chinese UI) or en for /search (English UI, default). " +
    "Returns structured products with HKD prices and URLs. " +
    "Call at most ONCE per turn with your best single query; then use showCitysuperProducts. " +
    "To see more results, use page/page_count—not another search with a different query.",
  inputSchema: citysuperSearchInputSchema,
  execute: async (
    ctx: ToolCtx,
    { query, locale, sort_by, limit, page, page_count },
  ): Promise<{
    query: string;
    locale: string;
    sort_by: string;
    page: number;
    pages_scraped: number;
    result_count: number;
    products: unknown[];
    search_url: string;
  }> => {
    if (ctx.threadId) {
      await ctx.runMutation(internal.citysuper.turnGuard.acquireCitysuperSearch, {
        threadId: ctx.threadId,
      });
    }

    const result = await ctx.runAction(
      internal.citysuper.searchProducts.searchProducts,
      {
        query,
        locale,
        sort_by,
        limit,
        page,
        page_count,
      },
    );

    if (ctx.threadId) {
      await ctx.runMutation(
        internal.citysuper.turnGuard.saveCitysuperSearchProducts,
        {
          threadId: ctx.threadId,
          products: result.products,
        },
      );
    }

    return result;
  },
});
