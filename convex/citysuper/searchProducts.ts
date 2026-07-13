"use node";

import { v } from "convex/values";
import { api } from "../_generated/api";
import { internalAction } from "../_generated/server";
import {
  CITYSUPER_ORIGIN,
  CITYSUPER_PRODUCT_SEARCH_JSON_SCHEMA,
  CITYSUPER_MAX_PAGE_COUNT,
  CITYSUPER_LOCALES,
  CITYSUPER_SORT_OPTIONS,
  DEFAULT_CITYSUPER_LOCALE,
  getCitysuperExtractionPrompt,
  getCitysuperSearchBase,
  type CitysuperLocale,
  type CitysuperSortBy,
} from "./schema";
import {
  filterProductsByQueryRelevance,
  sortProductsByPrice,
} from "./relevance";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 48;
const DEFAULT_PAGE = 1;

export type CitysuperProduct = {
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

export type CitysuperSearchResult = {
  query: string;
  locale: CitysuperLocale;
  sort_by: CitysuperSortBy;
  page: number;
  pages_scraped: number;
  result_count: number;
  products: CitysuperProduct[];
  search_url: string;
};

function isCitysuperSortBy(value: string): value is CitysuperSortBy {
  return (CITYSUPER_SORT_OPTIONS as readonly string[]).includes(value);
}

function isCitysuperLocale(value: string): value is CitysuperLocale {
  return (CITYSUPER_LOCALES as readonly string[]).includes(value);
}

export function buildCitysuperSearchUrl(
  query: string,
  sortBy: CitysuperSortBy,
  page: number = DEFAULT_PAGE,
  locale: CitysuperLocale = DEFAULT_CITYSUPER_LOCALE,
): string {
  const params = new URLSearchParams({ q: query });
  if (sortBy !== "relevance") {
    params.set("sort_by", sortBy);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  return `${getCitysuperSearchBase(locale)}?${params.toString()}`;
}

function mergeProductsByUrl(products: CitysuperProduct[]): CitysuperProduct[] {
  const seen = new Set<string>();
  const merged: CitysuperProduct[] = [];
  for (const product of products) {
    if (seen.has(product.product_url)) continue;
    seen.add(product.product_url);
    merged.push(product);
  }
  return merged;
}

function toAbsoluteUrl(url: string | undefined): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  try {
    return new URL(trimmed, CITYSUPER_ORIGIN).href;
  } catch {
    return /^https?:\/\//i.test(trimmed) ? trimmed : undefined;
  }
}

function normalizeProduct(raw: Record<string, unknown>): CitysuperProduct | null {
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const productUrl = toAbsoluteUrl(
    typeof raw.product_url === "string" ? raw.product_url : undefined,
  );
  if (!name || !productUrl) return null;

  const product: CitysuperProduct = {
    name,
    product_url: productUrl,
  };

  if (typeof raw.position === "number" && Number.isFinite(raw.position)) {
    product.position = Math.round(raw.position);
  }
  if (typeof raw.brand === "string" && raw.brand.trim()) {
    product.brand = raw.brand.trim();
  }
  const imageUrl = toAbsoluteUrl(
    typeof raw.image_url === "string" ? raw.image_url : undefined,
  );
  if (imageUrl) product.image_url = imageUrl;
  if (typeof raw.regular_price_hkd === "number" && Number.isFinite(raw.regular_price_hkd)) {
    product.regular_price_hkd = raw.regular_price_hkd;
  }
  if (typeof raw.sale_price_hkd === "number" && Number.isFinite(raw.sale_price_hkd)) {
    product.sale_price_hkd = raw.sale_price_hkd;
  }
  if (typeof raw.currency === "string" && raw.currency.trim()) {
    product.currency = raw.currency.trim();
  } else {
    product.currency = "HKD";
  }
  if (typeof raw.size === "string" && raw.size.trim()) {
    product.size = raw.size.trim();
  }
  if (typeof raw.availability === "string" && raw.availability.trim()) {
    product.availability = raw.availability.trim();
  }

  return product;
}

function parseScrapeJson(json: unknown): CitysuperProduct[] {
  if (!json || typeof json !== "object") return [];
  const doc = json as Record<string, unknown>;
  const productsRaw = doc.products;
  if (!Array.isArray(productsRaw)) return [];

  const products: CitysuperProduct[] = [];
  for (const item of productsRaw) {
    if (!item || typeof item !== "object") continue;
    const normalized = normalizeProduct(item as Record<string, unknown>);
    if (normalized) products.push(normalized);
  }
  return products;
}

export const searchProducts = internalAction({
  args: {
    query: v.string(),
    locale: v.optional(v.string()),
    sort_by: v.optional(v.string()),
    limit: v.optional(v.number()),
    page: v.optional(v.number()),
    page_count: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<CitysuperSearchResult> => {
    const query = args.query.trim();
    if (!query) {
      throw new Error("query is required");
    }

    const localeRaw = (args.locale ?? DEFAULT_CITYSUPER_LOCALE).trim();
    const locale: CitysuperLocale = isCitysuperLocale(localeRaw)
      ? localeRaw
      : DEFAULT_CITYSUPER_LOCALE;

    const sortByRaw = (args.sort_by ?? "relevance").trim();
    const sortBy: CitysuperSortBy = isCitysuperSortBy(sortByRaw)
      ? sortByRaw
      : "relevance";

    let limit = args.limit ?? DEFAULT_LIMIT;
    if (!Number.isFinite(limit) || limit < 1) {
      limit = DEFAULT_LIMIT;
    }
    limit = Math.min(Math.floor(limit), MAX_LIMIT);

    let startPage = args.page ?? DEFAULT_PAGE;
    if (!Number.isFinite(startPage) || startPage < 1) {
      startPage = DEFAULT_PAGE;
    }
    startPage = Math.floor(startPage);

    let pageCount = args.page_count ?? 1;
    if (!Number.isFinite(pageCount) || pageCount < 1) {
      pageCount = 1;
    }
    pageCount = Math.min(
      Math.floor(pageCount),
      CITYSUPER_MAX_PAGE_COUNT,
    );

    const allProducts: CitysuperProduct[] = [];
    let scrapedResultCount = 0;
    const searchUrls: string[] = [];

    // Always scrape relevance-ranked pages. Price sort on Shopify buries the
    // actual product under cheap accessories that merely mention the query.
    // We re-sort filtered results by price below when requested.
    const scrapeSort: CitysuperSortBy = "relevance";

    for (let offset = 0; offset < pageCount; offset++) {
      const pageNum = startPage + offset;
      const searchUrl = buildCitysuperSearchUrl(
        query,
        scrapeSort,
        pageNum,
        locale,
      );
      searchUrls.push(searchUrl);

      const scrapeResult: {
        success: boolean;
        json: unknown;
      } = await ctx.runAction(api.firecrawl.scrape.scrape, {
        url: searchUrl,
        schema: CITYSUPER_PRODUCT_SEARCH_JSON_SCHEMA,
        prompt: getCitysuperExtractionPrompt(locale),
      });

      if (!scrapeResult.success) {
        throw new Error(`CitySuper scrape failed for page ${pageNum}`);
      }

      const pageProducts = parseScrapeJson(scrapeResult.json);
      if (pageProducts.length === 0 && offset === 0) {
        throw new Error("CitySuper scrape returned no structured products");
      }

      allProducts.push(...pageProducts);

      const jsonDoc =
        scrapeResult.json && typeof scrapeResult.json === "object"
          ? (scrapeResult.json as Record<string, unknown>)
          : null;

      if (jsonDoc && typeof jsonDoc.result_count === "number") {
        scrapedResultCount = jsonDoc.result_count;
      }
    }

    const merged = mergeProductsByUrl(allProducts);
    if (merged.length === 0) {
      throw new Error("CitySuper scrape returned no structured products");
    }

    const relevant = filterProductsByQueryRelevance(query, merged);
    const ordered =
      sortBy === "price-ascending"
        ? sortProductsByPrice(relevant, "ascending")
        : sortBy === "price-descending"
          ? sortProductsByPrice(relevant, "descending")
          : relevant;

    const limitedProducts = ordered.slice(0, limit);

    return {
      query,
      locale,
      sort_by: sortBy,
      page: startPage,
      pages_scraped: pageCount,
      result_count:
        scrapedResultCount > 0 ? scrapedResultCount : relevant.length,
      products: limitedProducts,
      search_url:
        searchUrls[0] ??
        buildCitysuperSearchUrl(query, scrapeSort, startPage, locale),
    };
  },
});
