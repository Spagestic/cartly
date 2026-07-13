import { z } from "zod";
import { createTool, type ToolCtx } from "@convex-dev/agent";
import { internal } from "./_generated/api";
import type { CitysuperStoredProduct } from "./citysuper/productValidators";

const showCitysuperProductsInputSchema = z.object({
  title: z
    .string()
    .optional()
    .describe("Optional heading shown above the product cards."),
  products: z
    .array(
      z.object({
        product_url: z
          .string()
          .url()
          .describe(
            "Exact product_url from the latest citysuperSearch results (required). Do not invent URLs.",
          ),
        note: z
          .string()
          .optional()
          .describe("Short reason this product matches the user's request."),
      }),
    )
    .min(1)
    .max(8)
    .describe(
      "Picks from citysuperSearch: only product_url (+ optional note). Name, image, prices are filled from search results.",
    ),
});

type ShowCitysuperProductsResult = {
  title?: string;
  products: Array<CitysuperStoredProduct & { note?: string }>;
};

export const showCitysuperProducts = createTool({
  description:
    "Display curated City'super product picks as interactive cards in the chat UI. " +
    "Required after every citysuperSearch: call once with 3–6 picks. " +
    "Pass only product_url values copied from the latest citysuperSearch results—never invent URLs, names, images, or prices. " +
    "Optional note per product for a one-line recommendation. Do not skip this tool.",
  inputSchema: showCitysuperProductsInputSchema,
  execute: async (
    ctx: ToolCtx,
    input,
  ): Promise<ShowCitysuperProductsResult> => {
    if (!ctx.threadId) {
      throw new Error("showCitysuperProducts requires an active chat thread.");
    }

    const resolved: { products: ShowCitysuperProductsResult["products"] } =
      await ctx.runQuery(
        internal.citysuper.turnGuard.resolveShowCitysuperProducts,
        {
          threadId: ctx.threadId,
          picks: input.products.map((p) => ({
            product_url: p.product_url,
            note: p.note,
          })),
        },
      );

    return {
      title: input.title,
      products: resolved.products,
    };
  },
});
