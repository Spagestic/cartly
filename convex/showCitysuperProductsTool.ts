import { z } from "zod";
import { createTool } from "@convex-dev/agent";

const citysuperProductItemSchema = z.object({
  name: z.string().min(1),
  product_url: z.string().url(),
  brand: z.string().optional(),
  image_url: z.string().url().optional(),
  regular_price_hkd: z.number().optional(),
  sale_price_hkd: z.number().optional(),
  currency: z.string().optional(),
  size: z.string().optional(),
  availability: z.string().optional(),
  note: z
    .string()
    .optional()
    .describe("Short reason this product matches the user's request."),
});

const showCitysuperProductsInputSchema = z.object({
  title: z
    .string()
    .optional()
    .describe("Optional heading shown above the product cards."),
  products: z
    .array(citysuperProductItemSchema)
    .min(1)
    .max(8)
    .describe(
      "Curated products to display (copy fields from citysuperSearch results).",
    ),
});

export const showCitysuperProducts = createTool({
  description:
    "Display curated City'super product picks as interactive cards in the chat UI. " +
    "Required after every citysuperSearch: call once with 3–6 products from that search result. " +
    "Copy name, prices, URLs, and images from search results—never invent product data. " +
    "Use optional note per product for a one-line recommendation. Do not skip this tool.",
  inputSchema: showCitysuperProductsInputSchema,
  execute: async (_ctx, input) => {
    return {
      title: input.title,
      products: input.products,
    };
  },
});
