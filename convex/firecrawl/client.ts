"use node";

import FirecrawlApp from "@mendable/firecrawl-js";

export const getFirecrawlClient = () => {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error("FIRECRAWL_API_KEY must be set in the Convex dashboard");
  }
  return new FirecrawlApp({
    apiKey: process.env.FIRECRAWL_API_KEY,
  });
};
