/** Tokens ignored when scoring product-name relevance to a search query. */
const QUERY_STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "best",
  "good",
  "great",
  "some",
  "any",
  "into",
  "over",
  "under",
  "about",
  "around",
  "budget",
  "hkd",
  "hk$",
  "price",
  "cheap",
  "cheapest",
]);

function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !QUERY_STOPWORDS.has(t));
}

/**
 * Drop search hits whose titles barely match the query.
 * Shopify price-sort often ranks accessories that merely mention the product.
 * Falls back to the original list if filtering would empty it.
 */
export function filterProductsByQueryRelevance<
  T extends { name: string },
>(query: string, products: T[]): T[] {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0 || products.length === 0) {
    return products;
  }

  const trailingPhrase =
    tokens.length >= 2 ? tokens.slice(-2).join(" ") : null;
  const minHits = Math.min(
    tokens.length,
    Math.max(2, Math.ceil(tokens.length * 0.6)),
  );

  const filtered = products.filter((product) => {
    const name = product.name.toLowerCase();
    if (trailingPhrase && name.includes(trailingPhrase)) {
      return true;
    }
    const hits = tokens.filter((token) => name.includes(token)).length;
    return hits >= minHits;
  });

  return filtered.length > 0 ? filtered : products;
}

export function sortProductsByPrice<
  T extends { sale_price_hkd?: number; regular_price_hkd?: number },
>(products: T[], direction: "ascending" | "descending"): T[] {
  const priceOf = (p: T): number => {
    if (typeof p.sale_price_hkd === "number") return p.sale_price_hkd;
    if (typeof p.regular_price_hkd === "number") return p.regular_price_hkd;
    return Number.POSITIVE_INFINITY;
  };

  return [...products].sort((a, b) => {
    const diff = priceOf(a) - priceOf(b);
    return direction === "ascending" ? diff : -diff;
  });
}
