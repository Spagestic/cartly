"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { getFirecrawlClient } from "./client";

export const startAgent = action({
  args: {
    prompt: v.string(),
    urls: v.optional(v.array(v.string())),
    schema: v.optional(v.any()),
    maxCredits: v.optional(v.number()),
    strictConstrainToURLs: v.optional(v.boolean()),
    model: v.optional(v.union(v.literal("spark-1-pro"), v.literal("spark-1-mini"))),
  },
  handler: async (ctx, args) => {
    const normalizedPrompt = args.prompt?.trim();
    if (!normalizedPrompt) {
      throw new Error("Missing or invalid `prompt`");
    }

    if (
      args.urls &&
      (!Array.isArray(args.urls) ||
        args.urls.some((url) => typeof url !== "string"))
    ) {
      throw new Error("`urls` must be an array of strings");
    }

    if (args.maxCredits !== undefined && args.maxCredits <= 0) {
      throw new Error("`maxCredits` must be greater than 0");
    }

    const firecrawl = getFirecrawlClient();
    return await firecrawl.startAgent({
      prompt: normalizedPrompt,
      ...(args.urls ? { urls: args.urls } : {}),
      ...(args.schema ? { schema: args.schema } : {}),
      ...(args.maxCredits !== undefined ? { maxCredits: args.maxCredits } : {}),
      ...(args.strictConstrainToURLs !== undefined
        ? { strictConstrainToURLs: args.strictConstrainToURLs }
        : {}),
      ...(args.model ? { model: args.model } : {}),
    });
  },
});

export const getAgentStatus = action({
  args: {
    jobId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.jobId?.trim()) {
      throw new Error("Missing `jobId`");
    }
    const firecrawl = getFirecrawlClient();
    return await firecrawl.getAgentStatus(args.jobId);
  },
});
