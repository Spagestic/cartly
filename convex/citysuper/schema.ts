export const CITYSUPER_ORIGIN = "https://online.citysuper.com.hk";

export const CITYSUPER_LOCALES = ["en", "zh"] as const;
export type CitysuperLocale = (typeof CITYSUPER_LOCALES)[number];
export const DEFAULT_CITYSUPER_LOCALE: CitysuperLocale = "en";

export function getCitysuperSearchPath(locale: CitysuperLocale): string {
  return locale === "zh" ? "/zh/search" : "/search";
}

export function getCitysuperSearchBase(
  locale: CitysuperLocale = DEFAULT_CITYSUPER_LOCALE,
): string {
  return `${CITYSUPER_ORIGIN}${getCitysuperSearchPath(locale)}`;
}

export const CITYSUPER_SORT_OPTIONS = [
  "relevance",
  "price-ascending",
  "price-descending",
] as const;

export type CitysuperSortBy = (typeof CITYSUPER_SORT_OPTIONS)[number];

/** Max result pages to scrape in one citysuperSearch call (each page = one Firecrawl scrape). */
export const CITYSUPER_MAX_PAGE_COUNT = 2;

export const CITYSUPER_PRODUCT_SEARCH_JSON_SCHEMA = {
  type: "object",
  properties: {
    query: { type: "string" },
    result_count: { type: "integer" },
    sort_by: { type: "string" },
    products: {
      type: "array",
      items: {
        type: "object",
        properties: {
          position: { type: "integer" },
          name: { type: "string" },
          brand: { type: "string" },
          product_url: { type: "string" },
          image_url: { type: "string" },
          regular_price_hkd: { type: "number" },
          sale_price_hkd: { type: "number" },
          currency: { type: "string" },
          size: { type: "string" },
          availability: { type: "string" },
        },
        required: ["name", "product_url"],
      },
    },
  },
  required: ["products"],
} as const;

const CITYSUPER_EXTRACTION_PROMPT_COMMON = `Extract product listings from the City'super E-Shop search results page only.

Focus on the main search results grid for the search query. Ignore navigation menus, footer, cart, category sidebars, recommendations, trending, and other promotional sections outside the search results grid.

For each product card in the search results on the requested page:
- position: 1-based index in visible sort order on the page
- name: full product title as shown on the page
- brand: vendor/brand name if shown separately from the title
- product_url: full https://online.citysuper.com.hk/... product page URL (preserve /zh/ in the path when present)
- image_url: full https URL to the product image
- regular_price_hkd: numeric HKD from the regular/list price (strip $, HK$, and commas)
- sale_price_hkd: numeric HKD from the sale/discounted price when shown; omit if same as regular
- currency: always "HKD"
- size: size/volume/weight from parentheses in the title when present (e.g. 750mL, 500g)
- availability: stock status from badges or button state, in the language shown on the page

Set result_count from the page total if visible, otherwise use the number of products extracted.
Set query and sort_by from the page context when available.`;

const CITYSUPER_EXTRACTION_PROMPT_EN = `${CITYSUPER_EXTRACTION_PROMPT_COMMON}

English UI hints: results heading "Search results"; prices labeled "Regular price" / "Sale price"; availability e.g. "In stock", "Sold out", "Discontinued"; total like "279 results".`;

const CITYSUPER_EXTRACTION_PROMPT_ZH = `${CITYSUPER_EXTRACTION_PROMPT_COMMON}

Traditional Chinese UI hints: results heading "搜尋結果"; prices labeled "原價" / "特價" or "售價"; availability e.g. "有貨", "售罄", "缺貨", "停產"; total like "279 項結果".`;

export function getCitysuperExtractionPrompt(locale: CitysuperLocale): string {
  return locale === "zh"
    ? CITYSUPER_EXTRACTION_PROMPT_ZH
    : CITYSUPER_EXTRACTION_PROMPT_EN;
}
