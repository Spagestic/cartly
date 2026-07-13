import { v } from "convex/values";

/** Shared product shape stored on search turns and returned to the agent/UI. */
export const citysuperProductValidator = v.object({
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
});

export type CitysuperStoredProduct = {
  position?: number;
  name: string;
  brand?: string;
  product_url: string;
  image_url?: string;
  regular_price_hkd?: number;
  sale_price_hkd?: number;
  currency?: string;
  size?: string;
  availability?: string;
};

/** Match product URLs ignoring query/hash (Shopify adds _pos/_sid/_ss). */
export function citysuperProductUrlKey(url: string): string {
  try {
    const parsed = new URL(url.trim());
    const path = parsed.pathname.replace(/\/+$/, "") || "/";
    return `${parsed.origin.toLowerCase()}${path}`;
  } catch {
    return url.trim();
  }
}
